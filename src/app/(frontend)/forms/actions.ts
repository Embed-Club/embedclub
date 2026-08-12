'use server'

import { dispatchCertificatesForForm } from '@/lib/certificateDispatch'
import { driveConfigured, getDriveFileMeta } from '@/lib/googleDrive'
import type { Form } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { after } from 'next/server'
import { getPayload } from 'payload'

/** Answers are keyed by each form field's Payload row id. */
export type FormAnswers = Record<string, string | string[]>

export interface SubmitFormResult {
  success: boolean
  message: string
  fieldErrors?: Record<string, string>
  /** Present when the form issues a certificate the moment it is submitted. */
  certificate?: { name: string }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Crude in-process rate limit. The submit path writes to the database on every
 * call and is reachable by anyone, so this stops a trivial flood. It resets on
 * deploy and is per-instance — good enough for a club site, and deliberately
 * not a substitute for a real WAF if this ever gets seriously targeted.
 */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const recentSubmits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recentSubmits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  hits.push(now)
  recentSubmits.set(key, hits)

  // Stop the map growing without bound on a long-lived instance
  if (recentSubmits.size > 500) {
    for (const [k, v] of recentSubmits) {
      if (v.every((t) => now - t > RATE_LIMIT_WINDOW_MS)) recentSubmits.delete(k)
    }
  }

  return hits.length > RATE_LIMIT_MAX
}

type FormField = NonNullable<NonNullable<Form['steps']>[number]['fields']>[number]

/** One verified respondent upload, recorded alongside the answers. */
interface Attachment {
  label: string
  fieldId: string
  driveFileId: string
  fileName: string
  mimeType: string
}

function eachField(form: Form): FormField[] {
  const out: FormField[] = []
  for (const step of form.steps ?? []) {
    for (const field of step.fields ?? []) out.push(field)
  }
  return out
}

export async function submitForm(
  slug: string,
  answers: FormAnswers,
  /** Hidden field that only a bot fills in. */
  honeypot?: string,
): Promise<SubmitFormResult> {
  try {
    // Silently accept and discard obvious bots — telling them why just helps
    // them adapt.
    if (honeypot) {
      return { success: true, message: 'Your response has been recorded. Thank you!' }
    }

    if (rateLimited(slug)) {
      return { success: false, message: 'Too many submissions just now — try again in a minute.' }
    }

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const form = result.docs[0]
    if (!form) return { success: false, message: 'This form no longer exists.' }

    if (!form.active) return { success: false, message: 'This form is closed.' }
    if (form.deadline && new Date(form.deadline).getTime() < Date.now()) {
      return { success: false, message: 'The deadline for this form has passed.' }
    }

    // Validate against the form definition — never trust the client's idea of
    // what the form contains.
    const fieldErrors: Record<string, string> = {}
    const byId: Record<string, string | string[]> = {}
    const byLabel: Record<string, string | string[]> = {}
    const attachments: Attachment[] = []
    let submitterName: string | undefined
    let submitterEmail: string | undefined

    for (const field of eachField(form)) {
      const key = field.id
      if (!key) continue

      // An image row is decoration the officer placed in the form; there is no
      // input beside it, so there is nothing to validate or store.
      if (field.fieldType === 'image') continue

      const value = answers[key]
      const isEmpty =
        value === undefined || value === '' || (Array.isArray(value) && value.length === 0)

      if (field.required && isEmpty) {
        fieldErrors[key] = `${field.label} is required`
        continue
      }
      if (isEmpty) continue

      if (field.fieldType === 'email' && typeof value === 'string' && !EMAIL_RE.test(value)) {
        fieldErrors[key] = 'Enter a valid email address'
        continue
      }

      if (['select', 'radio', 'checkbox'].includes(field.fieldType)) {
        const allowed = (field.options ?? []).map((o) => o.option)
        const values = Array.isArray(value) ? value : [value]
        if (values.some((v) => !allowed.includes(v))) {
          fieldErrors[key] = `Invalid choice for ${field.label}`
          continue
        }
      }

      // An upload answer is a Drive file id the browser got back from
      // /api/form-uploads. Anyone can post an arbitrary id here, so it is only
      // accepted if Drive says we uploaded it for *this* form and question.
      if (field.fieldType === 'imageUpload') {
        if (typeof value !== 'string' || !driveConfigured()) {
          fieldErrors[key] = `Re-attach the photo for ${field.label}`
          continue
        }
        let meta: Awaited<ReturnType<typeof getDriveFileMeta>> = null
        try {
          meta = await getDriveFileMeta(value)
        } catch (err) {
          console.error('[Forms] Attachment lookup failed:', err)
        }
        if (!meta || meta.formSlug !== form.slug || meta.fieldId !== key) {
          fieldErrors[key] = `That photo could not be verified — re-attach it for ${field.label}`
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

      byId[key] = value
      byLabel[field.label] = value

      if (field.role === 'name' && typeof value === 'string') submitterName = value.trim()
      if (field.role === 'email' && typeof value === 'string') {
        const email = value.trim().toLowerCase()
        if (EMAIL_RE.test(email)) {
          submitterEmail = email
        } else {
          fieldErrors[key] = 'Enter a valid email address'
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    const issuesCertificate = Boolean(form.showCertificate)

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
      await payload.create({ collection: 'form-submissions', overrideAccess: true, data })
    }

    // Email the certificate *after* the response is sent, so a slow or broken
    // SMTP hop never makes the student wait and never costs them their
    // submission. Anything that fails here stays `pending` and the cron retries.
    if (issuesCertificate && form.certificateDelivery === 'immediate' && submitterEmail) {
      after(async () => {
        try {
          await dispatchCertificatesForForm(form.id)
        } catch (err) {
          console.error('[Forms] Immediate certificate dispatch failed:', err)
        }
      })
    }

    return {
      success: true,
      message: form.confirmationMessage || 'Your response has been recorded. Thank you!',
      // Immediate delivery also lets them download it there and then.
      certificate:
        issuesCertificate && form.certificateDelivery === 'immediate' && submitterName
          ? { name: submitterName }
          : undefined,
    }
  } catch (error) {
    console.error('[Forms] Submission error:', error)
    return { success: false, message: 'Something went wrong — please try again.' }
  }
}
