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
  /** Overrides the Google title. */
  title?: string
  type?: 'registration' | 'feedback' | 'general'
  /** Container this form is a section of, plus what the section is called. */
  sectionOf?: number
  sectionLabel?: string
  sectionOrder?: number
  relatedEvent?: number
}

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

  const planned = planSteps(googleForm)
  if (planned.length === 0) {
    console.log('  no questions — skipping')
    return
  }

  // Images first: a field row referencing one needs its id, and the collection
  // refuses an image row without a picture.
  const steps: FormStep[] = []
  for (const step of planned) {
    const fields: FormField[] = []
    for (const field of step.fields) {
      if (isImageRow(field)) {
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
      sectionOf: options.sectionOf,
      sectionLabel: options.sectionLabel,
      sectionOrder: options.sectionOrder,
      relatedEvent: options.relatedEvent,
      steps,
    },
  })) as Form

  console.log(`  form #${created.id} — ${steps.length} step(s)`)

  // Answers are keyed by Payload's field row id, so the mapping from Google's
  // question ids only exists once the form has been written and read back.
  const byGoogleId = new Map<string, { id: string; label: string }>()
  const flatPlanned = planned
    .flatMap((step) => step.fields)
    .filter((field): field is MappedField => !isImageRow(field))
  const flatCreated = (created.steps ?? []).flatMap((step) => step.fields ?? [])
  let cursor = 0
  for (const field of flatCreated) {
    if (field.fieldType === 'image') continue
    const source = flatPlanned[cursor++]
    if (source && field.id)
      byGoogleId.set(source.googleQuestionId, { id: field.id, label: field.label })
  }

  const responses = await fetchResponses(googleForm.formId, token)
  console.log(`  ${responses.length} response(s)`)

  const nameField = flatCreated.find((f) => f.role === 'name')
  const emailField = flatCreated.find((f) => f.role === 'email')
  let written = 0

  for (const response of responses) {
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

    const submitterName = nameField?.id ? String(answers[nameField.id] ?? '') : ''
    const submitterEmail = emailField?.id
      ? String(answers[emailField.id] ?? '')
      : (response.respondentEmail ?? '')

    await payload.create({
      collection: 'form-submissions',
      overrideAccess: true,
      data: {
        form: created.id,
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
  /** A single form. Omit when this entry is a container with sections. */
  formId?: string
  title: string
  type?: 'registration' | 'feedback' | 'general'
  relatedEvent?: number
  sections?: { formId: string; label: string; title?: string; order?: number }[]
}

async function importManifest(
  payload: PayloadClient,
  entries: ManifestEntry[],
  token: string,
): Promise<void> {
  for (const entry of entries) {
    if (entry.sections?.length) {
      // The container is created first: its sections need its id, and it is the
      // thing that carries the title and the event for all of them.
      const existing = await payload.find({
        collection: 'forms',
        where: { slug: { equals: generateSlug(entry.title) } },
        limit: 1,
        overrideAccess: true,
      })

      const container =
        existing.docs[0] ??
        (await payload.create({
          collection: 'forms',
          overrideAccess: true,
          data: {
            title: entry.title,
            slug: generateSlug(entry.title),
            type: entry.type ?? 'feedback',
            active: false,
            sectionGroup: true,
            relatedEvent: entry.relatedEvent,
          },
        }))

      console.log(`\n${entry.title}  (container #${container.id})`)

      for (const [index, section] of entry.sections.entries()) {
        await importForm(payload, await fetchForm(section.formId, token), token, {
          title: section.title ?? `${entry.title} — ${section.label}`,
          type: entry.type,
          sectionOf: container.id,
          sectionLabel: section.label,
          sectionOrder: section.order ?? index + 1,
          relatedEvent: entry.relatedEvent,
        })
      }
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

async function main() {
  const args = process.argv.slice(2)
  const plan = args.includes('--plan')
  const manifestArg = args.find((a) => a.startsWith('--manifest='))
  const formIds = args.filter((a) => !a.startsWith('--'))

  if (manifestArg) {
    const path = manifestArg.slice('--manifest='.length)
    const entries = JSON.parse(await readFile(path, 'utf8')) as ManifestEntry[]
    const token = await accessToken()
    const payload = await getPayload({ config })
    await importManifest(payload, entries, token)
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
