import 'server-only'

import type { Form, FormSubmission } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { DISPLAY_ONLY_TYPES, type Field, type Step, isGrid } from './formAnswers'
import { withResolvedSteps } from './formQueries'

/**
 * Optional copy of a response into the Google Form the site form was modelled
 * on.
 *
 * Google has no API for writing responses - the Forms API can create and read
 * forms, but only a respondent can submit one. So this posts to the same public
 * `formResponse` endpoint the form itself uses, with one `entry.<id>` per
 * question. That endpoint is unofficial and Google answers 200 even for a
 * malformed submission, so a 2xx is treated as delivered and anything else is
 * recorded against the submission for the cron to retry.
 *
 * The site stays the system of record: a failed forward never loses the
 * response, it only leaves the copy pending.
 */

const TIMEOUT_MS = 15_000

export interface ForwardResult {
  forwarded: number
  failed: number
}

export interface GooglePayload {
  params: URLSearchParams
  /** Why the response cannot be represented in Google at all, if it cannot. */
  error: string | null
  /** File upload questions, which this endpoint cannot carry. */
  skippedUploads: string[]
}

/** The formResponse endpoint for a public Google Form URL, or null if it has no ID. */
export function googleFormEndpoint(url: string): string | null {
  const modern = url.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/)?.[1]
  if (modern) return `https://docs.google.com/forms/d/e/${modern}/formResponse`

  const legacy = url.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/)?.[1]
  if (legacy) return `https://docs.google.com/forms/d/${legacy}/formResponse`

  return null
}

/** Short forms.gle links carry no ID, so follow the redirect to find one. */
async function resolveEndpoint(url: string): Promise<string | null> {
  const direct = googleFormEndpoint(url)
  if (direct) return direct

  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const location = res.headers.get('location')
    if (location) {
      const found = googleFormEndpoint(location)
      if (found) return found
    }
    // Some short links answer 200 with the form page rather than a redirect.
    return googleFormEndpoint(await res.text())
  } catch {
    return null
  }
}

/** One answer as Google expects it: a value per `entry.<id>` line. */
function answerValues(field: Field, value: unknown): string[] {
  if (isGrid(field)) {
    const grid = (
      typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
    ) as Record<string, string | string[]>
    return Object.entries(grid).flatMap(([row, choice]) => {
      const picks = Array.isArray(choice) ? choice : [choice]
      return picks.map((p) => `${row}: ${p}`)
    })
  }
  if (Array.isArray(value)) return value.map((v) => String(v))
  return [String(value)]
}

/**
 * Map one stored response onto Google's entry fields.
 *
 * Pure, so the mapping can be tested without a network call and the HTTP path
 * stays a separate concern. A question with no entry ID is an error rather than
 * a silent skip: dropping an answer would make the Google copy quietly
 * incomplete, which is the failure this whole feature must not have.
 */
export function buildGoogleFormPayload(
  steps: Step[] | null | undefined,
  answers: Record<string, unknown>,
): GooglePayload {
  const params = new URLSearchParams()
  const unmapped: string[] = []
  const skippedUploads: string[] = []

  for (const step of steps ?? []) {
    for (const field of step.fields ?? []) {
      if (DISPLAY_ONLY_TYPES.includes(field.fieldType)) continue
      const id = field.id
      if (!id) continue

      const value = answers[id]
      if (value === undefined || value === null) continue

      if (field.fieldType === 'imageUpload') {
        skippedUploads.push(field.label || 'Untitled')
        continue
      }

      const entry = field.googleEntryId?.trim()
      if (!entry) {
        unmapped.push(field.label || 'Untitled')
        continue
      }

      for (const text of answerValues(field, value)) params.append(`entry.${entry}`, text)
    }
  }

  return {
    params,
    error:
      unmapped.length > 0
        ? `No Google Forms entry ID for: ${[...new Set(unmapped)].join(', ')}`
        : null,
    skippedUploads,
  }
}

async function formFor(payload: Payload, submission: FormSubmission): Promise<Form> {
  const ref = submission.form
  if (typeof ref === 'object' && ref) return ref as Form
  if (typeof ref === 'number') {
    return (await payload.findByID({ collection: 'forms', id: ref, depth: 0 })) as Form
  }
  throw new Error('Submission has no form')
}

type ForwardStatus = NonNullable<FormSubmission['googleForwardStatus']>

async function mark(
  payload: Payload,
  id: number,
  status: ForwardStatus,
  error: string | null,
  at: string | null,
): Promise<void> {
  await payload.update({
    collection: 'form-submissions',
    id,
    overrideAccess: true,
    data: {
      googleForwardStatus: status,
      googleForwardError: error,
      googleForwardedAt: at,
    },
  })
}

/** One unreadable record must not stop the rest of the batch. */
async function safeMark(
  payload: Payload,
  id: number,
  status: ForwardStatus,
  error: string | null,
  at: string | null,
): Promise<void> {
  try {
    await mark(payload, id, status, error, at)
  } catch (err) {
    console.error(`[GoogleForms] Could not update submission ${id}:`, err)
  }
}

/**
 * Push responses that have not reached their Google Form yet.
 *
 * Idempotency is best-effort and worth stating plainly: Google has no request
 * key, so a POST that times out after Google recorded it will be sent again on
 * the next pass and create a duplicate. That is deliberately preferred over a
 * missing registration - a duplicate can be deleted, a missing one cannot be
 * recovered. Only `pending` and `failed` rows are picked up, so a form that
 * stops forwarding does not keep retrying forever.
 */
export async function forwardPendingSubmissions(
  limit = 200,
  onlyFormId?: number,
): Promise<ForwardResult> {
  const payload = await getPayload({ config })

  const pending = await payload.find({
    collection: 'form-submissions',
    where: {
      and: [
        { googleForwardStatus: { in: ['pending', 'failed'] } },
        ...(onlyFormId === undefined ? [] : [{ form: { equals: onlyFormId } }]),
      ],
    },
    limit,
    depth: 0,
    sort: 'createdAt',
    overrideAccess: true,
  })

  let forwarded = 0
  let failed = 0

  for (const submission of pending.docs) {
    const form = await formFor(payload, submission).catch(() => null)
    const resolved = form ? await withResolvedSteps(form) : null
    const url = resolved?.googleFormUrl?.trim()

    // The form no longer forwards (or is gone): settle the row so it does not
    // sit in the queue forever.
    if (!resolved || !url) {
      await safeMark(payload, submission.id, 'notApplicable', null, null)
      continue
    }

    const built = buildGoogleFormPayload(
      resolved.steps,
      (submission.answers ?? {}) as Record<string, unknown>,
    )
    if (built.error) {
      await safeMark(payload, submission.id, 'failed', built.error, null)
      failed += 1
      continue
    }

    const endpoint = await resolveEndpoint(url)
    if (!endpoint) {
      await safeMark(
        payload,
        submission.id,
        'failed',
        'That Google Form link could not be resolved to a response endpoint.',
        null,
      )
      failed += 1
      continue
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: built.params.toString(),
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      if (res.ok) {
        const note =
          built.skippedUploads.length > 0
            ? `Note: file upload questions were not forwarded (${built.skippedUploads.join(', ')}).`
            : null
        await safeMark(payload, submission.id, 'forwarded', note, new Date().toISOString())
        forwarded += 1
      } else {
        await safeMark(
          payload,
          submission.id,
          'failed',
          `Google answered ${res.status} ${res.statusText || 'error'}.`,
          null,
        )
        failed += 1
      }
    } catch (error) {
      await safeMark(
        payload,
        submission.id,
        'failed',
        error instanceof Error ? error.message : String(error),
        null,
      )
      failed += 1
    }
  }

  return { forwarded, failed }
}
