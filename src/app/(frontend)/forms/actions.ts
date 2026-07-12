'use server'

import config from '@/payload/payload.config'
import { getPayload } from 'payload'

export type FormAnswers = Record<string, string | string[]>

export interface SubmitFormResult {
  success: boolean
  message: string
  fieldErrors?: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "entry.123" or "123" → "entry.123" */
function normalizeEntryId(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.startsWith('entry.') ? trimmed : `entry.${trimmed}`
}

/** viewform URL → formResponse URL */
function toFormResponseUrl(viewUrl: string): string | null {
  try {
    const url = new URL(viewUrl)
    if (!url.hostname.includes('docs.google.com')) return null
    url.search = ''
    url.pathname = url.pathname.replace(/\/(viewform|formResponse).*$/, '/formResponse')
    if (!url.pathname.endsWith('/formResponse')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/formResponse`
    }
    return url.toString()
  } catch {
    return null
  }
}

export async function submitForm(slug: string, answers: FormAnswers): Promise<SubmitFormResult> {
  try {
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

    // Server-side validation against the form definition
    const fieldErrors: Record<string, string> = {}
    const labelled: Record<string, string | string[]> = {}

    for (const step of form.steps ?? []) {
      for (const field of step.fields ?? []) {
        const key = normalizeEntryId(field.googleEntryId)
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

        labelled[field.label] = value
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, message: 'Please fix the highlighted fields.', fieldErrors }
    }

    // Store locally first — the club's own record survives even if Google is down
    const submission = await payload.create({
      collection: 'form-submissions',
      overrideAccess: true,
      data: {
        form: form.id,
        answers: labelled,
        googleForwardStatus: 'pending',
      },
    })

    // Forward to the Google Form so the linked Sheet gets the row
    let forwardStatus: 'forwarded' | 'failed' = 'failed'
    const responseUrl = toFormResponseUrl(form.googleFormUrl)
    if (responseUrl) {
      try {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(answers)) {
          if (Array.isArray(value)) {
            for (const v of value) params.append(key, v)
          } else if (value !== '') {
            params.append(key, value)
          }
        }
        const res = await fetch(responseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        })
        // Google returns 200 even for the thank-you page; 4xx = wrong entry IDs
        forwardStatus = res.ok ? 'forwarded' : 'failed'
      } catch (err) {
        console.error('[Forms] Google forward failed:', err)
      }
    }

    await payload.update({
      collection: 'form-submissions',
      id: submission.id,
      overrideAccess: true,
      data: { googleForwardStatus: forwardStatus },
    })

    return {
      success: true,
      message: form.confirmationMessage || 'Your response has been recorded. Thank you!',
    }
  } catch (error) {
    console.error('[Forms] Submission error:', error)
    return { success: false, message: 'Something went wrong — please try again.' }
  }
}
