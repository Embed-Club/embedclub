import type { Certificate } from '@/payload/payload-types'
import type { Payload, PayloadRequest } from 'payload'

/**
 * How certificates and forms find each other.
 *
 * A certificate links to one form. When that form is answered in sections,
 * the certificate covers every section, because the responses are filed
 * against the sections and never against the parent.
 */

type CertificateLike = Pick<Certificate, 'form' | 'enabled'>

const idOf = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return Number(value.id)
  return null
}

/** Every form id whose responses a certificate linked to `formId` covers. */
export async function coveredFormIds(
  payload: Payload,
  formId: number,
  req?: PayloadRequest,
): Promise<number[]> {
  const sections = await payload.find({
    collection: 'forms',
    where: { sectionOf: { equals: formId } },
    limit: 100,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  return [formId, ...sections.docs.map((section) => section.id)]
}

/** The certificate a response to this form earns, if any - its own, or its parent's. */
export async function certificateForForm(
  payload: Payload,
  form: { id: number; sectionOf?: unknown },
): Promise<Certificate | null> {
  const ids = [form.id, idOf(form.sectionOf)].filter((id): id is number => id !== null)
  const found = await payload.find({
    collection: 'certificates',
    where: { and: [{ form: { in: ids } }, { enabled: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return found.docs[0] ?? null
}

/**
 * Keep response statuses in step with the certificate that covers them.
 *
 * Switching a certificate on (or linking it) moves that form's responses from
 * `notApplicable` to `pending`, so people who answered before the certificate
 * existed are sent one too. Switching it off, unlinking or deleting moves
 * `pending` back - never `sent` or `failed`, which are history.
 */
export async function syncCertificateStatuses(
  payload: Payload,
  doc: CertificateLike,
  previous: CertificateLike | undefined,
  req?: PayloadRequest,
): Promise<void> {
  const nowId = doc.enabled !== false ? idOf(doc.form) : null
  const beforeId = previous && previous.enabled !== false ? idOf(previous.form) : null
  if (nowId === beforeId && previous) return

  if (beforeId !== null && beforeId !== nowId) {
    await payload.update({
      collection: 'form-submissions',
      where: {
        and: [
          { form: { in: await coveredFormIds(payload, beforeId, req) } },
          { certificateStatus: { equals: 'pending' } },
        ],
      },
      data: { certificateStatus: 'notApplicable' },
      overrideAccess: true,
      req,
    })
  }

  if (nowId !== null) {
    await payload.update({
      collection: 'form-submissions',
      where: {
        and: [
          { form: { in: await coveredFormIds(payload, nowId, req) } },
          { certificateStatus: { equals: 'notApplicable' } },
        ],
      },
      data: { certificateStatus: 'pending' },
      overrideAccess: true,
      req,
    })
  }
}
