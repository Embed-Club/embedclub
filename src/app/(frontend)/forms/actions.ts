'use server'

import { dispatchCertificatesForForm } from '@/lib/certificateDispatch'
import { certificateForForm } from '@/lib/certificateLinks'
import {
  EMAIL_RE,
  type FormAnswers,
  answerError,
  isDisplayOnly,
  isEmptyAnswer,
  labelledAnswers,
  visitedSteps,
} from '@/lib/formAnswers'
import { withResolvedSteps } from '@/lib/formQueries'
import { driveConfigured, getDriveFileMeta } from '@/lib/googleDrive'
import { syncPendingSubmissions } from '@/lib/googleSheets'
import { isRateLimited } from '@/lib/rateLimit'
import { USN_FORMAT_HINT, isValidUsn, normalizeUsn } from '@/lib/usn'
import config from '@/payload/payload.config'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { getPayload } from 'payload'

export type { FormAnswers }

export interface SubmitFormResult {
  success: boolean
  message: string
  fieldErrors?: Record<string, string>
  /** The consent box was not ticked - highlight it rather than a question. */
  consentError?: boolean
  /** Present when the form issues a certificate the moment it is submitted. */
  certificate?: { name: string }
}

/**
 * The submit path writes to the database on every call and is reachable by
 * anyone, so it is rate limited per visitor and form. Keying on the form alone
 * gave every visitor a shared budget, so five sign-ups in a minute locked the
 * form for everyone - precisely what a registration form does when a session
 * opens.
 */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

/**
 * Caller identity for the rate limit. Vercel sets `x-forwarded-for`; the first
 * entry is the client. Falls back to a shared bucket when there is no header at
 * all, which only happens off-platform.
 */
async function clientKey(slug: string): Promise<string> {
  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `form:${slug}:${ip}`
}

/** One verified respondent upload, recorded alongside the answers. */
interface Attachment {
  label: string
  fieldId: string
  driveFileId: string
  fileName: string
  mimeType: string
}

export async function submitForm(
  slug: string,
  answers: FormAnswers,
  /** Hidden field that only a bot fills in. */
  honeypot?: string,
  /** Whether the respondent ticked the privacy consent box. */
  consented?: boolean,
): Promise<SubmitFormResult> {
  try {
    // Silently accept and discard obvious bots - telling them why just helps
    // them adapt. Trimmed: a browser or password manager that autofills the
    // hidden field with a space would otherwise bin a real person's answers
    // behind a success message.
    if (honeypot?.trim()) {
      return {
        success: true,
        message: 'Your response has been recorded. Thank you!',
      }
    }

    const overLimit = await isRateLimited({
      key: await clientKey(slug),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
    if (overLimit) {
      return {
        success: false,
        message: 'Too many submissions just now - try again in a minute.',
      }
    }

    // Consent is checked here and not only in the browser: the box is what makes
    // storing someone's name, email and payment proof lawful, so a submission
    // that skipped the client-side check must not be storable either.
    if (!consented) {
      return {
        success: false,
        message: 'Please agree to the privacy notice before submitting.',
        consentError: true,
      }
    }

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const found = result.docs[0]
    if (!found) return { success: false, message: 'This form no longer exists.' }

    // A section stores no questions of its own - it asks its parent's. Validate
    // against those, and keep the section's id so the response is filed under
    // the group that gave it.
    const form = await withResolvedSteps(found)

    if (!form.active) return { success: false, message: 'This form is closed.' }
    if (form.deadline && new Date(form.deadline).getTime() < Date.now()) {
      return {
        success: false,
        message: 'The deadline for this form has passed.',
      }
    }

    // Validate against the form definition - never trust the client's idea of
    // what the form contains.
    const fieldErrors: Record<string, string> = {}
    const byId: FormAnswers = {}
    const byLabel: Record<string, string | string[]> = {}
    const attachments: Attachment[] = []
    let submitterName: string | undefined
    let submitterEmail: string | undefined

    // Only pages the respondent actually reached count. A branch that skipped
    // page 3 means its required questions were never asked, and anything left
    // there from before the choice changed is not part of this response.
    const steps = form.steps ?? []
    const reached = visitedSteps(steps, answers)

    for (const stepIndex of reached) {
      for (const field of steps[stepIndex]?.fields ?? []) {
        const key = field.id
        if (!key || isDisplayOnly(field)) continue

        // `let`: a USN answer is normalized in place before it is stored.
        let value = answers[key]
        const problem = answerError(field, value)
        if (problem) {
          fieldErrors[key] = problem
          continue
        }
        if (value === undefined || isEmptyAnswer(value)) continue

        // An upload answer is a Drive file id the browser got back from
        // /api/form-uploads. Anyone can post an arbitrary id here, so it is only
        // accepted if Drive says we uploaded it for *this* form and question.
        if (field.fieldType === 'imageUpload') {
          if (typeof value !== 'string' || !driveConfigured()) {
            fieldErrors[key] = 'Re-attach the file'
            continue
          }
          let meta: Awaited<ReturnType<typeof getDriveFileMeta>> = null
          try {
            meta = await getDriveFileMeta(value)
          } catch (err) {
            console.error('[Forms] Attachment lookup failed:', err)
          }
          if (!meta || meta.formSlug !== form.slug || meta.fieldId !== key) {
            fieldErrors[key] = 'That file could not be verified - attach it again'
            continue
          }
          attachments.push({
            label: field.label,
            fieldId: key,
            driveFileId: meta.id,
            fileName: meta.name,
            mimeType: meta.mimeType,
          })
        }

        // Upper-cased before it is stored, not just before it is displayed: the
        // stored answer is what the responses sheet sorts on.
        if (field.role === 'usn' && typeof value === 'string') {
          const usn = normalizeUsn(value)
          if (!isValidUsn(usn)) {
            fieldErrors[key] = `Enter a valid USN - ${USN_FORMAT_HINT}`
            continue
          }
          value = usn
        }

        byId[key] = value
        for (const [label, answer] of labelledAnswers(field, value)) byLabel[label] = answer

        if (field.role === 'name' && typeof value === 'string') submitterName = value.trim()
        if (field.role === 'email' && typeof value === 'string') {
          const email = value.trim().toLowerCase()
          if (EMAIL_RE.test(email)) submitterEmail = email
          else fieldErrors[key] = 'Enter a valid email address'
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors,
      }
    }

    // Certificates are their own documents now, linked to this form or to the
    // parent it is a section of.
    const certificate = await certificateForForm(payload, form)
    const issuesCertificate = Boolean(certificate)
    const immediate = issuesCertificate && certificate?.delivery !== 'scheduled'

    // One response per email per form. A second submission replaces the first
    // rather than creating a duplicate, so nobody gets two certificates.
    let existingId: number | null = null
    if (submitterEmail) {
      const dupes = await payload.find({
        collection: 'form-submissions',
        where: {
          and: [{ form: { equals: form.id } }, { submitterEmail: { equals: submitterEmail } }],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      existingId = dupes.docs[0]?.id ?? null
    }

    const data = {
      form: form.id,
      submitterName,
      submitterEmail,
      answers: byId,
      answersByLabel: byLabel,
      attachments,
      // Stamped from the server clock. A resubmission re-stamps, because the
      // consent that counts is the one covering the answers now on file.
      consentAcceptedAt: new Date().toISOString(),
      certificateStatus: issuesCertificate ? ('pending' as const) : ('notApplicable' as const),
    }

    if (existingId) {
      await payload.update({
        collection: 'form-submissions',
        id: existingId,
        overrideAccess: true,
        // Clearing the sync stamp puts the corrected answers back in the sheet
        // queue. The sync upserts on Submission ID, so this rewrites their
        // existing row rather than adding a second one.
        data: { ...data, sheetSyncedAt: null },
      })
    } else {
      await payload.create({
        collection: 'form-submissions',
        overrideAccess: true,
        data,
      })
    }

    // Mirror to the form's Google Sheet once the response is on its way back,
    // so the sheet shows it within seconds instead of at the next cron run -
    // which GitHub Actions stretches to hours. A failure here only means the
    // cron picks it up later; the response itself is already safe.
    if (form.sheetId || process.env.GOOGLE_SHEETS_ID) {
      after(async () => {
        try {
          await syncPendingSubmissions(20, form.id)
        } catch (err) {
          console.error('[Forms] Sheet sync after submit failed:', err)
        }
      })
    }

    // Email the certificate *after* the response is sent, so a slow or broken
    // SMTP hop never makes the student wait and never costs them their
    // submission. Anything that fails here stays `pending` and the cron retries.
    if (immediate && submitterEmail) {
      after(async () => {
        try {
          await dispatchCertificatesForForm(form)
        } catch (err) {
          console.error('[Forms] Immediate certificate dispatch failed:', err)
        }
      })
    }

    return {
      success: true,
      message: form.confirmationMessage || 'Your response has been recorded. Thank you!',
      // Immediate delivery also lets them download it there and then.
      certificate: immediate && submitterName ? { name: submitterName } : undefined,
    }
  } catch (error) {
    console.error('[Forms] Submission error:', error)
    return {
      success: false,
      message: 'Something went wrong - please try again.',
    }
  }
}
