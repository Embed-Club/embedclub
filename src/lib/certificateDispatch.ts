import 'server-only'

import { appsScriptConfigured, sendCertificate } from '@/lib/appsScript'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

export interface DispatchResult {
  attempted: number
  sent: number
  failed: number
  skipped: string[]
}

/**
 * Send certificates for one form to everyone still marked `pending`.
 *
 * The PDF is built and mailed by the Apps Script web app (see
 * `scripts/appsScript/certificateSender.gs`); this decides who gets one and
 * records the outcome.
 *
 * Rolling by design: it can be called repeatedly and simply picks up whoever
 * is pending now, so someone who submits feedback the morning after the send
 * time still gets theirs on the next pass. Status is per recipient, so a
 * failure retries without re-sending to people who already received one.
 */
export async function dispatchCertificatesForForm(
  formId: number,
  limit = 200,
): Promise<DispatchResult> {
  const result: DispatchResult = { attempted: 0, sent: 0, failed: 0, skipped: [] }

  if (!appsScriptConfigured()) {
    result.skipped.push('Apps Script is not configured')
    return result
  }

  const payload = await getPayload({ config })
  const form = await payload.findByID({ collection: 'forms', id: formId, depth: 0 })

  if (!form?.showCertificate) {
    result.skipped.push('form does not issue certificates')
    return result
  }

  const pending = await payload.find({
    collection: 'form-submissions',
    where: {
      and: [{ form: { equals: formId } }, { certificateStatus: { equals: 'pending' } }],
    },
    limit,
    depth: 0,
    overrideAccess: true,
  })

  for (const submission of pending.docs) {
    const name = submission.submitterName?.trim()
    const email = submission.submitterEmail?.trim()

    if (!name || !email) {
      await payload.update({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: true,
        data: {
          certificateStatus: 'failed',
          certificateError: 'Submission has no name or email',
        },
      })
      result.failed += 1
      continue
    }

    result.attempted += 1

    try {
      await sendCertificate({
        name,
        email,
        formTitle: form.title,
        templateId: form.certificateTemplateDriveId?.trim() || undefined,
      })

      await payload.update({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: true,
        data: {
          certificateStatus: 'sent',
          certificateSentAt: new Date().toISOString(),
          certificateError: null,
        },
      })
      result.sent += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[Certificates] Send failed for submission ${submission.id}:`, message)
      await payload.update({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: true,
        data: { certificateStatus: 'failed', certificateError: message.slice(0, 500) },
      })
      result.failed += 1
    }
  }

  return result
}

/**
 * Every form whose certificates are due: scheduled ones past their send time,
 * and immediate ones (whose recipients are marked pending the moment they
 * submit, so this doubles as the retry path for those).
 */
export async function dispatchDueCertificates(): Promise<Record<string, DispatchResult>> {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()

  const due = await payload.find({
    collection: 'forms',
    where: {
      and: [
        { showCertificate: { equals: true } },
        {
          or: [
            { certificateDelivery: { equals: 'immediate' } },
            {
              and: [
                { certificateDelivery: { equals: 'scheduled' } },
                { certificateSendAt: { less_than_equal: now } },
              ],
            },
          ],
        },
      ],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const out: Record<string, DispatchResult> = {}
  for (const form of due.docs) {
    out[form.slug] = await dispatchCertificatesForForm(form.id)
  }
  return out
}

/** Re-exported so callers don't need to know which backend does the sending. */
export function certificateSenderConfigured(): boolean {
  return appsScriptConfigured()
}
