/**
 * Import the club's Google Forms — questions and responses — into Payload.
 *
 *   FORMS_MIGRATION_REFRESH_TOKEN=… pnpm tsx scripts/migrateGoogleForms.ts <formId…>
 *   FORMS_MIGRATION_REFRESH_TOKEN=… pnpm tsx scripts/migrateGoogleForms.ts --plan <formId…>
 *
 * The club ran on Google Forms from 2020 to 2026 — around forty of them, and
 * the only record of who attended what. Google Forms cannot be read by the
 * Drive API (a form is not an exportable file), so this uses the Forms API,
 * which needs its own scopes. The credential is passed in rather than read from
 * GOOGLE_DRIVE_REFRESH_TOKEN: that one is production's, it can write, and this
 * job only ever reads.
 *
 * Imported forms are created inactive. They are a record of something that
 * already happened, not something to reopen — and this points at the same Neon
 * instance production does, so anything active here is live immediately.
 *
 * Idempotent: a form whose `googleFormId` is already present is skipped whole,
 * and responses are matched on their Google response id, so a re-run after a
 * partial failure resumes rather than duplicating.
 *
 * Two things it deliberately does not do:
 *
 *   - Respondent uploads stay in the club's Drive. A submission records the
 *     file id, name and type, exactly as a native submission does. Copying
 *     ninety payment screenshots into the site's bucket would duplicate files
 *     the club already owns.
 *   - Officer-authored images (a payment QR, a poster) ARE copied, into
 *     `form-media`. They are site content once the form is on the site, and an
 *     image row with no picture is refused by the collection anyway.
 */
import 'dotenv/config'

import { readFile } from 'node:fs/promises'
import type { Form } from '@/payload/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

import { generateSlug } from '../src/payload/collections/learningFields'

/**
 * Field shapes taken from the generated types rather than restated, so that
 * adding a question type to the collection breaks this script at compile time
 * instead of at import time.
 */
type FormStep = NonNullable<Form['steps']>[number]
type FormField = NonNullable<FormStep['fields']>[number]
type FieldType = FormField['fieldType']
type FieldRole = NonNullable<FormField['role']>

const FORMS_API = 'https://forms.googleapis.com/v1/forms'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

/* ------------------------------------------------------------------ Google */

interface GoogleOption {
  value?: string
  isOther?: boolean
}
interface GoogleQuestion {
  questionId?: string
  required?: boolean
  textQuestion?: { paragraph?: boolean }
  choiceQuestion?: { type?: string; options?: GoogleOption[] }
  scaleQuestion?: { low?: number; high?: number; lowLabel?: string; highLabel?: string }
  dateQuestion?: Record<string, unknown>
  timeQuestion?: Record<string, unknown>
  fileUploadQuestion?: Record<string, unknown>
}
interface GoogleImage {
  contentUri?: string
  altText?: string
}
interface GoogleItem {
  itemId?: string
  title?: string
  description?: string
  questionItem?: { question?: GoogleQuestion; image?: GoogleImage }
  questionGroupItem?: {
    questions?: { questionId?: string; rowQuestion?: { title?: string } }[]
    grid?: { columns?: { type?: string; options?: GoogleOption[] } }
  }
  pageBreakItem?: Record<string, unknown>
  imageItem?: { image?: GoogleImage }
}
interface GoogleForm {
  formId: string
  info?: { title?: string; documentTitle?: string; description?: string }
  items?: GoogleItem[]
}
interface GoogleAnswer {
  questionId?: string
  textAnswers?: { answers?: { value?: string }[] }
  fileUploadAnswers?: { answers?: { fileId?: string; fileName?: string; mimeType?: string }[] }
}
interface GoogleResponse {
  responseId: string
  createTime?: string
  respondentEmail?: string
  answers?: Record<string, GoogleAnswer>
}

async function accessToken(): Promise<string> {
  const refresh = process.env.FORMS_MIGRATION_REFRESH_TOKEN
  if (!refresh) {
    throw new Error(
      'FORMS_MIGRATION_REFRESH_TOKEN is not set. Mint one with the Forms read-only scopes.',
    )
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(json)}`)
  return json.access_token
}

/** Google resets the odd connection; retrying once is enough in practice. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }
  throw lastError
}

async function fetchForm(formId: string, token: string): Promise<GoogleForm> {
  const res = await withRetry(() =>
    fetch(`${FORMS_API}/${formId}`, { headers: { Authorization: `Bearer ${token}` } }),
  )
  if (!res.ok) throw new Error(`Form ${formId} failed (${res.status}): ${await res.text()}`)
  return (await res.json()) as GoogleForm
}

async function fetchResponses(formId: string, token: string): Promise<GoogleResponse[]> {
  const all: GoogleResponse[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(`${FORMS_API}/${formId}/responses`)
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await withRetry(() =>
      fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } }),
    )
    if (!res.ok) throw new Error(`Responses ${formId} failed (${res.status}): ${await res.text()}`)
    const json = (await res.json()) as { responses?: GoogleResponse[]; nextPageToken?: string }
    all.push(...(json.responses ?? []))
    pageToken = json.nextPageToken
  } while (pageToken)
  return all
}

/* ----------------------------------------------------------------- Mapping */

/**
 * Which question holds the person's name and which their email.
 *
 * Guessed from the wording, because Google has no concept of it and the site
 * needs both for certificates. Guessing beats leaving every imported form
 * without them, and a wrong guess is visible and fixable in the admin — where
 * a missing one is silent until a certificate fails to send.
 */
const NAME_RE = /^\s*(full\s+)?name\b|name of (the )?(attendee|participant|student)|your name/i
const EMAIL_RE = /e-?mail/i
const PHONE_RE = /phone|mobile|whatsapp|contact\s*(no|number)/i

function guessRole(title: string, fieldType: FieldType): FieldRole {
  if (fieldType === 'email' || EMAIL_RE.test(title)) return 'email'
  if (NAME_RE.test(title)) return 'name'
  return 'none'
}

interface MappedField {
  googleQuestionId: string
  label: string
  fieldType: FieldType
  required: boolean
  role: FieldRole
  helpText?: string
  options?: { option: string }[]
}

/** One Google question as a Payload field row. */
function mapQuestion(
  title: string,
  description: string | undefined,
  q: GoogleQuestion,
): MappedField {
  const label = title.trim() || 'Question'
  let fieldType: FieldType = 'text'
  let options: { option: string }[] | undefined
  let helpText = description?.trim() || undefined

  if (q.textQuestion) {
    fieldType = q.textQuestion.paragraph
      ? 'textarea'
      : EMAIL_RE.test(label)
        ? 'email'
        : PHONE_RE.test(label)
          ? 'phone'
          : 'text'
  } else if (q.choiceQuestion) {
    fieldType =
      q.choiceQuestion.type === 'CHECKBOX'
        ? 'checkbox'
        : q.choiceQuestion.type === 'DROP_DOWN'
          ? 'select'
          : 'radio'
    options = (q.choiceQuestion.options ?? [])
      .map((o) => ({ option: (o.value ?? '').trim() }))
      .filter((o) => o.option)
  } else if (q.scaleQuestion) {
    // Payload has no scale type. Radio over the same numbers keeps every stored
    // answer valid — they are already "1".."5" — and the endpoint labels move
    // into the help text rather than being dropped.
    const low = q.scaleQuestion.low ?? 1
    const high = q.scaleQuestion.high ?? 5
    fieldType = 'radio'
    options = Array.from({ length: high - low + 1 }, (_, i) => ({ option: String(low + i) }))
    const ends = [
      q.scaleQuestion.lowLabel ? `${low} = ${q.scaleQuestion.lowLabel}` : null,
      q.scaleQuestion.highLabel ? `${high} = ${q.scaleQuestion.highLabel}` : null,
    ].filter(Boolean)
    if (ends.length) helpText = [helpText, ends.join(' · ')].filter(Boolean).join(' — ')
  } else if (q.dateQuestion) {
    fieldType = 'date'
  } else if (q.fileUploadQuestion) {
    fieldType = 'imageUpload'
  } else if (q.timeQuestion) {
    // No time field on the site; the stored answer is already a string.
    fieldType = 'text'
  }

  return {
    googleQuestionId: q.questionId ?? '',
    label,
    fieldType,
    required: Boolean(q.required),
    role: guessRole(label, fieldType),
    helpText,
    options,
  }
}

export interface PlannedStep {
  stepTitle: string
  stepDescription?: string
  fields: (MappedField | { imageUri: string; alt: string; label: string })[]
}

function isImageRow(
  field: PlannedStep['fields'][number],
): field is { imageUri: string; alt: string; label: string } {
  return 'imageUri' in field
}

/**
 * Split a Google form into wizard steps.
 *
 * A page break is exactly a step boundary, which is why the two-screen shape of
 * a registration form survives the import instead of collapsing into one long
 * page.
 */
function planSteps(form: GoogleForm): PlannedStep[] {
  const steps: PlannedStep[] = [{ stepTitle: form.info?.title?.trim() || 'Details', fields: [] }]

  for (const item of form.items ?? []) {
    const current = steps[steps.length - 1]

    if (item.pageBreakItem) {
      steps.push({
        stepTitle: item.title?.trim() || `Step ${steps.length + 1}`,
        stepDescription: item.description?.trim() || undefined,
        fields: [],
      })
      continue
    }

    if (item.imageItem?.image?.contentUri) {
      current.fields.push({
        imageUri: item.imageItem.image.contentUri,
        alt: item.imageItem.image.altText?.trim() || item.title?.trim() || 'Form image',
        label: item.title?.trim() || 'Image',
      })
      continue
    }

    if (item.questionItem?.question) {
      current.fields.push(
        mapQuestion(item.title ?? '', item.description, item.questionItem.question),
      )
      continue
    }

    // A grid asks the same choices about several rows. Payload has no grid, so
    // each row becomes its own question — which is how the answers come back
    // from Google anyway, one per row.
    if (item.questionGroupItem?.questions) {
      const columns = (item.questionGroupItem.grid?.columns?.options ?? [])
        .map((o) => ({ option: (o.value ?? '').trim() }))
        .filter((o) => o.option)
      for (const row of item.questionGroupItem.questions) {
        const rowTitle = row.rowQuestion?.title?.trim() || 'Row'
        current.fields.push({
          googleQuestionId: row.questionId ?? '',
          label: item.title ? `${item.title.trim()} — ${rowTitle}` : rowTitle,
          fieldType: 'radio',
          required: false,
          role: 'none',
          options: columns,
        })
      }
    }
  }

  // A page break with nothing after it is a real shape in Google (a thank-you
  // page); an empty step is not, and the collection requires each to have a
  // field.
  return steps.filter((step) => step.fields.length > 0)
}

/* ---------------------------------------------------------------- Payload */

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

/** Copy one officer-authored image into form-media, returning its doc id. */
async function importImage(
  payload: PayloadClient,
  uri: string,
  alt: string,
  name: string,
): Promise<number | null> {
  try {
    const res = await withRetry(() => fetch(uri))
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimetype = res.headers.get('content-type') ?? 'image/jpeg'
    const extension = mimetype.includes('png') ? 'png' : mimetype.includes('gif') ? 'gif' : 'jpg'
    const doc = await payload.create({
      collection: 'form-media',
      data: { alt },
      file: {
        data: buffer,
        mimetype,
        name: `${name
          .replace(/[^a-z0-9]+/gi, '-')
          .slice(0, 60)
          .toLowerCase()}.${extension}`,
        size: buffer.byteLength,
      },
      overrideAccess: true,
    })
    return doc.id
  } catch (error) {
    console.warn(`  ! image skipped: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

export interface ImportOptions {
  /** Overrides the Google title — most of the archive needs renaming. */
  title?: string
  type?: 'registration' | 'feedback' | 'general'
  relatedEvent?: number
}

/** Turn a Google form into Payload steps, uploading any images it contains. */
async function buildSteps(payload: PayloadClient, googleForm: GoogleForm): Promise<FormStep[]> {
  const steps: FormStep[] = []
  for (const step of planSteps(googleForm)) {
    const fields: FormField[] = []
    for (const field of step.fields) {
      if (isImageRow(field)) {
        // Images first: a field row referencing one needs its id, and the
        // collection refuses an image row without a picture.
        const mediaId = await importImage(payload, field.imageUri, field.alt, field.label)
        if (!mediaId) continue
        fields.push({ label: field.label, fieldType: 'image', displayImage: mediaId })
        continue
      }
      fields.push({
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        role: field.role,
        helpText: field.helpText,
        options: field.options,
        width: 'full',
      })
    }
    if (fields.length > 0) {
      steps.push({ stepTitle: step.stepTitle, stepDescription: step.stepDescription, fields })
    }
  }
  return steps
}

/**
 * Wording, reduced to what two forms asking the same thing have in common.
 *
 * Sections of one event were often built by different officers in different
 * years, so the same question appears as "E-mail I'd " and "E-mail ID". Case,
 * spacing and punctuation carry no meaning here; the letters do.
 */
function normaliseLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Which Payload field each Google question's answers belong in.
 *
 * Matched on wording rather than position, because a section's answers are
 * being filed against a template built from a *different* Google form — every
 * form has its own question ids, so wording is all they share. `aliases` covers
 * the cases wording alone cannot: "Payment Mode" and "Payment method" are the
 * same question, and only a human can say so.
 *
 * Position is used only when both forms ask the same number of questions. That
 * restraint is the point: where one section asks something the other does not,
 * every question after it shifts by one, and filing answers under the wrong
 * field silently is far worse than leaving them out and saying so.
 */
function mapAnswersToTemplate(
  googleForm: GoogleForm,
  templateFields: FormField[],
  aliases: Record<string, string> = {},
): { map: Map<string, { id: string; label: string }>; byPosition: string[]; dropped: string[] } {
  const answerable = templateFields.filter((f) => f.fieldType !== 'image')
  const byLabel = new Map<string, FormField[]>()
  for (const field of answerable) {
    const key = normaliseLabel(field.label)
    byLabel.set(key, [...(byLabel.get(key) ?? []), field])
  }

  const aliasByKey = new Map(
    Object.entries(aliases).map(([from, to]) => [normaliseLabel(from), normaliseLabel(to)]),
  )

  const sources = planSteps(googleForm)
    .flatMap((step) => step.fields)
    .filter((field): field is MappedField => !isImageRow(field))

  const sameShape = sources.length === answerable.length
  const map = new Map<string, { id: string; label: string }>()
  const byPosition: string[] = []
  const dropped: string[] = []
  const seen = new Map<string, number>()

  sources.forEach((source, index) => {
    const key = aliasByKey.get(normaliseLabel(source.label)) ?? normaliseLabel(source.label)
    const candidates = byLabel.get(key)
    let target: FormField | undefined

    if (candidates?.length) {
      // A form can legitimately repeat a label; take them in order.
      const used = seen.get(key) ?? 0
      target = candidates[Math.min(used, candidates.length - 1)]
      seen.set(key, used + 1)
    } else if (sameShape) {
      target = answerable[index]
      byPosition.push(source.label)
    } else {
      dropped.push(source.label)
    }

    if (target?.id) map.set(source.googleQuestionId, { id: target.id, label: target.label })
  })

  return { map, byPosition, dropped }
}

/** Copy one Google form's responses onto an existing Payload form. */
async function importResponses(
  payload: PayloadClient,
  targetFormId: number,
  googleForm: GoogleForm,
  templateFields: FormField[],
  token: string,
  aliases: Record<string, string> = {},
  defaults: Record<string, string> = {},
): Promise<void> {
  const {
    map: byGoogleId,
    byPosition,
    dropped,
  } = mapAnswersToTemplate(googleForm, templateFields, aliases)

  if (byPosition.length > 0) {
    console.warn(
      `  ! matched by position (same shape, different wording): ${byPosition.join('; ')}`,
    )
  }
  if (dropped.length > 0) {
    console.warn(
      `  ! NOT in the template, answers dropped: ${dropped.join('; ')}\n    Add an alias in the manifest if these are the same question under another name.`,
    )
  }

  // Constants this section's responses carry for questions its form never
  // asked, resolved to the template fields they belong in.
  const defaulted = Object.entries(defaults).flatMap(([label, value]) => {
    const field = templateFields.find(
      (f) => f.fieldType !== 'image' && normaliseLabel(f.label) === normaliseLabel(label),
    )
    if (!field?.id) {
      console.warn(`  ! default for "${label}" ignored — no such question in the template`)
      return []
    }
    return [{ id: field.id, label: field.label, value }]
  })
  if (defaulted.length > 0) {
    console.log(`  filling ${defaulted.map((d) => `${d.label}="${d.value}"`).join(', ')}`)
  }

  const responses = await fetchResponses(googleForm.formId, token)
  console.log(`  ${responses.length} response(s)`)

  const nameField = templateFields.find((f) => f.role === 'name')
  const emailField = templateFields.find((f) => f.role === 'email')
  let written = 0

  for (const response of responses) {
    // Re-running after a partial failure must not write a response twice.
    const already = await payload.find({
      collection: 'form-submissions',
      where: { googleResponseId: { equals: response.responseId } },
      limit: 1,
      overrideAccess: true,
    })
    if (already.docs.length > 0) continue

    const answers: Record<string, unknown> = {}
    const answersByLabel: Record<string, unknown> = {}
    const attachments = []

    for (const answer of Object.values(response.answers ?? {})) {
      const target = byGoogleId.get(answer.questionId ?? '')
      if (!target) continue

      if (answer.fileUploadAnswers?.answers?.length) {
        for (const file of answer.fileUploadAnswers.answers) {
          attachments.push({
            label: target.label,
            fieldId: target.id,
            driveFileId: file.fileId,
            fileName: file.fileName,
            mimeType: file.mimeType,
          })
        }
        const names = answer.fileUploadAnswers.answers.map((f) => f.fileName).join(', ')
        answers[target.id] = names
        answersByLabel[target.label] = names
        continue
      }

      const values = (answer.textAnswers?.answers ?? []).map((a) => a.value ?? '')
      const value = values.length > 1 ? values : (values[0] ?? '')
      answers[target.id] = value
      answersByLabel[target.label] = value
    }

    // Only where the respondent gave nothing — a real answer always wins.
    for (const fill of defaulted) {
      if (answers[fill.id] === undefined || answers[fill.id] === '') {
        answers[fill.id] = fill.value
        answersByLabel[fill.label] = fill.value
      }
    }

    const submitterName = nameField?.id ? String(answers[nameField.id] ?? '') : ''
    const submitterEmail = emailField?.id
      ? String(answers[emailField.id] ?? '')
      : (response.respondentEmail ?? '')

    await payload.create({
      collection: 'form-submissions',
      overrideAccess: true,
      data: {
        form: targetFormId,
        submitterName: submitterName || undefined,
        // Google captures the signed-in address separately from any email
        // question, and it is the more reliable of the two.
        submitterEmail: submitterEmail || response.respondentEmail || undefined,
        answers,
        answersByLabel,
        attachments,
        certificateStatus: 'notApplicable',
        googleResponseId: response.responseId,
        // Keep the date the person actually answered, not the import date —
        // otherwise every response in six years of archive reads as today.
        createdAt: response.createTime,
      },
    })
    written += 1
  }

  console.log(`  ${written} submission(s) written`)
}

/** A form that stands on its own: questions and responses from one Google form. */
async function importForm(
  payload: PayloadClient,
  googleForm: GoogleForm,
  token: string,
  options: ImportOptions,
): Promise<void> {
  const title = options.title ?? googleForm.info?.title?.trim() ?? 'Untitled form'
  console.log(`\n${title}  (${googleForm.formId})`)

  const existing = await payload.find({
    collection: 'forms',
    where: { googleFormId: { equals: googleForm.formId } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) {
    console.log('  already imported — skipping')
    return
  }

  const steps = await buildSteps(payload, googleForm)
  if (steps.length === 0) {
    console.log('  no questions — skipping')
    return
  }

  const created = (await payload.create({
    collection: 'forms',
    overrideAccess: true,
    data: {
      title,
      // Set here rather than left to the collection hook: nine of the archived
      // forms are called "Event Feedback" or "Event Registration", and the slug
      // is unique — the caller disambiguates by passing a title, and this keeps
      // the slug following whatever it chose.
      slug: generateSlug(title),
      type: options.type ?? 'registration',
      description: googleForm.info?.description?.trim() || undefined,
      // Imported forms are a record of something that already happened.
      active: false,
      googleFormId: googleForm.formId,
      relatedEvent: options.relatedEvent,
      steps,
    },
  })) as Form

  const fields = (created.steps ?? []).flatMap((step) => step.fields ?? [])
  console.log(`  form #${created.id} — ${steps.length} step(s)`)
  await importResponses(payload, created.id, googleForm, fields, token)
}

/**
 * One set of questions answered separately by two or more groups.
 *
 * The questions are taken from the first section and written once, on the
 * parent. Every section then files its answers against those same field ids,
 * which is what lets the sections be read together as one form or apart as the
 * groups that answered — a copy of the questions per section could do neither.
 */
async function importSectioned(
  payload: PayloadClient,
  entry: ManifestEntry,
  token: string,
): Promise<void> {
  const sections = entry.sections ?? []
  const slug = generateSlug(entry.title)

  const existing = await payload.find({
    collection: 'forms',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  let parent = existing.docs[0]
  if (!parent) {
    // The first section that actually has a form: an empty section has no
    // questions to lend.
    const templateFormId = entry.templateFrom ?? sections.find((s) => s.formId)?.formId
    if (!templateFormId) {
      console.log(`\n${entry.title}: no section has a form to take questions from — skipping`)
      return
    }
    const templateSource = await fetchForm(templateFormId, token)
    const steps = await buildSteps(payload, templateSource)
    if (steps.length === 0) {
      console.log(`\n${entry.title}: template form has no questions — skipping`)
      return
    }

    for (const [label, choices] of Object.entries(entry.templateOptions ?? {})) {
      const field = steps
        .flatMap((step) => step.fields ?? [])
        .find((f) => normaliseLabel(f.label) === normaliseLabel(label))
      if (!field) {
        console.warn(`  ! templateOptions for "${label}" ignored — no such question`)
        continue
      }
      field.options = choices.map((option) => ({ option }))
    }
    parent = (await payload.create({
      collection: 'forms',
      overrideAccess: true,
      data: {
        title: entry.title,
        slug,
        type: entry.type ?? 'feedback',
        description: templateSource.info?.description?.trim() || undefined,
        active: false,
        sectionGroup: true,
        relatedEvent: entry.relatedEvent,
        steps,
      },
    })) as Form
  }

  const templateFields = (parent.steps ?? []).flatMap((step) => step.fields ?? [])
  console.log(`\n${entry.title}  (#${parent.id}, ${templateFields.length} field(s))`)

  for (const [index, section] of sections.entries()) {
    console.log(`\n  ${section.label}  (${section.formId ?? 'no form — empty section'})`)

    const slugForSection = generateSlug(section.title ?? `${entry.title} ${section.label}`)
    const already = await payload.find({
      collection: 'forms',
      // A section with no Google form has no id to find it by, so fall back to
      // its slug — which is what makes a re-run leave it alone.
      where: section.formId
        ? { googleFormId: { equals: section.formId } }
        : { slug: { equals: slugForSection } },
      limit: 1,
      overrideAccess: true,
    })

    const sectionDoc =
      already.docs[0] ??
      ((await payload.create({
        collection: 'forms',
        overrideAccess: true,
        data: {
          title: section.title ?? `${entry.title} — ${section.label}`,
          slug: slugForSection,
          type: entry.type ?? 'feedback',
          active: false,
          googleFormId: section.formId,
          sectionOf: parent.id,
          sectionLabel: section.label,
          sectionOrder: section.order ?? index + 1,
          // The event link stays on the parent. The event's admin panel lists
          // every form pointing at it, and one entry that leads to its sections
          // reads better there than the same form listed three times.
        },
      })) as Form)

    if (!section.formId) {
      console.log('  (no responses — the form for this section was not kept)')
      continue
    }

    await importResponses(
      payload,
      sectionDoc.id,
      await fetchForm(section.formId, token),
      templateFields,
      token,
      section.aliases,
      section.defaults,
    )
  }
}

/* -------------------------------------------------------------------- Main */

/**
 * What to import, and under what name.
 *
 * A manifest rather than command-line ids because the archive needs decisions
 * that ids cannot carry: nine of the forms are called "Event Feedback", several
 * are two halves of one event, and the folder they sit in is often the only
 * clue to which year they belong. Keeping those decisions in one reviewable
 * file also means the run is repeatable — and arguable — after the fact.
 */
interface ManifestEntry {
  /** A single form. Omit when this entry has sections. */
  formId?: string
  title: string
  type?: 'registration' | 'feedback' | 'general'
  relatedEvent?: number
  /**
   * Which section's questions become the template. Defaults to the first.
   * Point it at the fullest one where sections differ — a question the template
   * lacks has nowhere to put its answers, while one no section asked is merely
   * empty.
   */
  templateFrom?: string
  /**
   * Replaces the choices on a template question, by wording.
   *
   * The template is one section's form, so a question that records *which*
   * section answered only offers that section's own value — B's form offers
   * "B" and nothing else. Widening it here makes the template describe the
   * whole event rather than the half it was copied from.
   */
  templateOptions?: Record<string, string[]>
  sections?: {
    /**
     * Omit where the club has the section but not its form — the ESP32-CAM
     * feedback survives only as the B section, and an A section that exists
     * with no responses is a truer record than pretending there was only ever
     * one group. It also gives the form somewhere to go if the missing one
     * turns up.
     */
    formId?: string
    label: string
    title?: string
    order?: number
    /** Google question wording → template wording, where they disagree. */
    aliases?: Record<string, string>
    /**
     * Values every response from this section gets for questions it never
     * asked. A form used only by the A section did not need to ask which
     * section you were in; the answer is still "A", and leaving it blank would
     * lose something the form's existence already tells us.
     */
    defaults?: Record<string, string>
  }[]
}

async function importManifest(
  payload: PayloadClient,
  entries: ManifestEntry[],
  token: string,
): Promise<void> {
  for (const entry of entries) {
    if (entry.sections?.length) {
      await importSectioned(payload, entry, token)
      continue
    }

    if (!entry.formId) {
      console.warn(`Skipping "${entry.title}": no formId and no sections.`)
      continue
    }

    await importForm(payload, await fetchForm(entry.formId, token), token, {
      title: entry.title,
      type: entry.type,
      relatedEvent: entry.relatedEvent,
    })
  }
}

/**
 * Delete everything a previous run of this script created.
 *
 * Only ever touches rows carrying a Google id, plus the parents those sections
 * hang off — nothing authored on the site has one, so a form somebody wrote
 * here cannot be caught by it. Exists because the import is re-runnable by
 * design: the shape of what it produces changed once already, and re-importing
 * from Google is more trustworthy than migrating a half-right copy.
 */
async function resetImported(payload: PayloadClient, onlySlug?: string): Promise<void> {
  // A single entry, so one mapping can be corrected without re-importing the
  // whole archive: the parent by slug, and the sections that hang off it.
  if (onlySlug) {
    const parents = await payload.find({
      collection: 'forms',
      where: { slug: { equals: onlySlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const parent = parents.docs[0]
    if (!parent) {
      console.log(`No form with slug "${onlySlug}".`)
      return
    }
    const children = await payload.find({
      collection: 'forms',
      where: { sectionOf: { equals: parent.id } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const ids = [parent.id, ...children.docs.map((c) => c.id)]
    const submissions = await payload.delete({
      collection: 'form-submissions',
      where: { form: { in: ids } },
      overrideAccess: true,
    })
    const forms = await payload.delete({
      collection: 'forms',
      where: { id: { in: ids } },
      overrideAccess: true,
    })
    console.log(
      `Reset "${onlySlug}": ${forms.docs.length} form(s), ${submissions.docs.length} submission(s).`,
    )
    return
  }

  const imported = await payload.find({
    collection: 'forms',
    where: { googleFormId: { exists: true } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const ids = new Set<number>()
  for (const form of imported.docs) {
    ids.add(form.id)
    // A parent holds the questions its sections were filed against, and is not
    // itself a Google form, so it has no id of its own to find it by.
    const parent = form.sectionOf
    if (typeof parent === 'number') ids.add(parent)
    else if (parent && typeof parent === 'object') ids.add(parent.id)
  }

  if (ids.size === 0) {
    console.log('Nothing imported to reset.')
    return
  }

  const submissions = await payload.delete({
    collection: 'form-submissions',
    where: { form: { in: [...ids] } },
    overrideAccess: true,
  })
  const forms = await payload.delete({
    collection: 'forms',
    where: { id: { in: [...ids] } },
    overrideAccess: true,
  })

  console.log(`Reset: ${forms.docs.length} form(s), ${submissions.docs.length} submission(s).`)
}

/**
 * Attach already-imported forms to their event, from the same manifest.
 *
 * Separate from the import because the archive was imported before anyone had
 * decided which event each form belonged to, and because the answer is a
 * judgement — the club ran "3D Printing Workshop" more than once, and only one
 * of them has an Events record. Re-running the import would skip these forms
 * entirely, so linking needs its own pass.
 *
 * Sections are left alone: the parent carries the link, and the event page
 * showing one form that leads to its sections beats it listing three.
 */
async function relink(payload: PayloadClient, entries: ManifestEntry[]): Promise<void> {
  for (const entry of entries) {
    if (!entry.relatedEvent) continue

    const slug = generateSlug(entry.title)
    const found = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    const form = found.docs[0]
    if (!form) {
      console.warn(`  ! no form with slug "${slug}" — not linked`)
      continue
    }

    await payload.update({
      collection: 'forms',
      id: form.id,
      data: { relatedEvent: entry.relatedEvent },
      overrideAccess: true,
    })
    console.log(`  #${form.id} ${form.title} → event #${entry.relatedEvent}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const plan = args.includes('--plan')
  const relinkOnly = args.includes('--relink')
  const resetArg = args.find((a) => a === '--reset' || a.startsWith('--reset='))

  if (resetArg) {
    const payload = await getPayload({ config })
    await resetImported(payload, resetArg.includes('=') ? resetArg.split('=')[1] : undefined)
    if (!args.some((a) => a.startsWith('--manifest='))) return
  }
  const manifestArg = args.find((a) => a.startsWith('--manifest='))
  const formIds = args.filter((a) => !a.startsWith('--'))

  if (manifestArg) {
    const path = manifestArg.slice('--manifest='.length)
    const entries = JSON.parse(await readFile(path, 'utf8')) as ManifestEntry[]
    const payload = await getPayload({ config })

    if (relinkOnly) {
      console.log('Linking forms to events:')
      await relink(payload, entries)
      console.log('\nDone.')
      return
    }

    await importManifest(payload, entries, await accessToken())
    console.log('\nDone.')
    return
  }

  if (formIds.length === 0) {
    console.error(
      'Usage: pnpm tsx scripts/migrateGoogleForms.ts [--plan] <formId…>\n' +
        '       pnpm tsx scripts/migrateGoogleForms.ts --manifest=<file.json>',
    )
    process.exit(1)
  }

  const token = await accessToken()

  if (plan) {
    for (const formId of formIds) {
      const form = await fetchForm(formId, token)
      console.log(`\n${form.info?.title} (${formId})`)
      for (const [index, step] of planSteps(form).entries()) {
        console.log(`  step ${index + 1}: ${step.stepTitle}`)
        for (const field of step.fields) {
          if (isImageRow(field)) {
            console.log(`    [image] ${field.label}`)
            continue
          }
          const extra = field.options?.length
            ? ` [${field.options.map((o) => o.option).join(' / ')}]`
            : ''
          console.log(
            `    ${field.label} → ${field.fieldType}${field.required ? ' *' : ''}${
              field.role !== 'none' ? ` (${field.role})` : ''
            }${extra}`,
          )
        }
      }
    }
    return
  }

  const payload = await getPayload({ config })
  for (const formId of formIds) {
    await importForm(payload, await fetchForm(formId, token), token, {})
  }
  console.log('\nDone.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
