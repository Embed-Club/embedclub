import 'server-only'

import { appsScriptConfigured, sendCertificate } from '@/lib/appsScript'
import { certificateForForm, coveredFormIds } from '@/lib/certificateLinks'
import { resolvePlaceholders } from '@/lib/certificatePlaceholders'
import { applyNameCase } from '@/lib/textCase'
import type { Certificate, FormSubmission } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * Recorded on a due submission when the site has no way to send its
 * certificate. Compared against on later runs, so the message is written once
 * rather than on every cron pass.
 */
const NOT_CONFIGURED = 'Apps Script is not configured (APPS_SCRIPT_URL / APPS_SCRIPT_SECRET)'

/** Fill {{name}}/{{event}} in a member-supplied subject/body template. */
export function fillPlaceholders(template: string, name: string, event: string): string {
  return template.replaceAll('{{name}}', name).replaceAll('{{event}}', event)
}

export interface DispatchResult {
  attempted: number
  sent: number
  failed: number
  skipped: string[]
}

/**
 * When a submission's certificate is due, or null if it isn't yet (or ever,
 * if nothing is configured to cover it).
 *
 * Immediate certificates are always due - dispatch there is the retry path
 * for a send that failed right after submit, and the path that catches up
 * everyone who answered before the certificate was set up.
 *
 * Scheduled certificates support named batches so different groups can go out
 * at different times. A batch is matched on one question's answer; the first
 * matching batch wins, and anyone matched by none falls back to `sendAt`.
 */
function dueAt(certificate: Certificate, submission: FormSubmission): Date | null {
  if (certificate.delivery !== 'scheduled') return new Date(0)

  const answers = (submission.answersByLabel ?? {}) as Record<string, unknown>

  for (const batch of certificate.batches ?? []) {
    if (!batch.matchField || !batch.sendAt) continue
    const answer = answers[batch.matchField]
    const values = Array.isArray(answer) ? answer.map(String) : [String(answer ?? '')]
    if (values.includes(batch.matchValue)) return new Date(batch.sendAt)
  }

  return certificate.sendAt ? new Date(certificate.sendAt) : null
}

/**
 * Send one certificate to everyone still marked `pending` on the forms it
 * covers, whose send time has come.
 *
 * The PDF is built and mailed by the Apps Script web app (see
 * `scripts/appsScript/certificateSender.gs`); this decides who gets one, when,
 * and records the outcome. Rolling by design: it can be called repeatedly and
 * picks up whoever is due now. Status is per recipient, so a failure retries
 * without re-sending to people who already received one.
 */
export async function dispatchCertificate(
  certificateId: number,
  limit = 200,
): Promise<DispatchResult> {
  const result: DispatchResult = { attempted: 0, sent: 0, failed: 0, skipped: [] }

  const payload = await getPayload({ config })
  const certificate = await payload.findByID({
    collection: 'certificates',
    id: certificateId,
    depth: 1,
    overrideAccess: true,
  })

  if (!certificate?.enabled) {
    result.skipped.push('certificate is switched off')
    return result
  }

  const form = typeof certificate.form === 'object' ? certificate.form : null
  const formId = form?.id ?? (certificate.form as number)
  const eventName = certificate.eventName?.trim() || form?.title || certificate.title || ''

  // Missing config is recorded on the rows it blocks rather than returning
  // silently, so a member can see why nothing went out.
  const notConfigured = !appsScriptConfigured()
  if (notConfigured) result.skipped.push(NOT_CONFIGURED)

  const pending = await payload.find({
    collection: 'form-submissions',
    where: {
      and: [
        { form: { in: await coveredFormIds(payload, formId) } },
        { certificateStatus: { equals: 'pending' } },
      ],
    },
    limit,
    depth: 0,
    overrideAccess: true,
  })

  const now = Date.now()

  for (const submission of pending.docs) {
    const due = dueAt(certificate, submission)
    if (!due || due.getTime() > now) continue

    // Due, but nothing to send it with. Stays `pending` - this fixes itself
    // the moment the env vars land, and `failed` would point at the recipient.
    if (notConfigured) {
      if (submission.certificateError !== NOT_CONFIGURED) {
        await payload.update({
          collection: 'form-submissions',
          id: submission.id,
          overrideAccess: true,
          data: { certificateError: NOT_CONFIGURED },
        })
      }
      continue
    }

    const name = submission.submitterName?.trim()
    const email = submission.submitterEmail?.trim()

    if (!name || !email) {
      await payload.update({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: true,
        data: { certificateStatus: 'failed', certificateError: 'Submission has no name or email' },
      })
      result.failed += 1
      continue
    }

    result.attempted += 1

    try {
      const certificateName = applyNameCase(name, certificate.nameCase)
      const emailName = applyNameCase(name, certificate.emailNameCase)

      await sendCertificate({
        certificateName,
        emailName,
        email,
        formTitle: eventName,
        placeholders: resolvePlaceholders(certificate, submission, certificateName, eventName),
        templateId: certificate.templateDriveId?.trim() || undefined,
        emailSubject: certificate.emailSubject
          ? fillPlaceholders(certificate.emailSubject, emailName, eventName)
          : undefined,
        emailBody: certificate.emailBody
          ? fillPlaceholders(certificate.emailBody, emailName, eventName)
          : undefined,
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

/** Run the certificate covering one form, if there is one - the after-submit path. */
export async function dispatchCertificatesForForm(form: {
  id: number
  sectionOf?: unknown
}): Promise<DispatchResult | null> {
  const payload = await getPayload({ config })
  const certificate = await certificateForForm(payload, form)
  return certificate ? dispatchCertificate(certificate.id) : null
}

/** Every switched-on certificate. Due-checking happens per recipient inside. */
export async function dispatchDueCertificates(): Promise<Record<string, DispatchResult>> {
  const payload = await getPayload({ config })
  const certificates = await payload.find({
    collection: 'certificates',
    where: { enabled: { equals: true } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const out: Record<string, DispatchResult> = {}
  for (const certificate of certificates.docs) {
    out[certificate.title || String(certificate.id)] = await dispatchCertificate(certificate.id)
  }
  return out
}

/** Re-exported so callers don't need to know which backend does the sending. */
export function certificateSenderConfigured(): boolean {
  return appsScriptConfigured()
}
