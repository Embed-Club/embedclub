import 'server-only'

import type { Form, FormSubmission } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'
import { SHEETS_SCOPE, accessToken, googleCredentialsPresent } from './googleAuth'
import { driveViewUrl } from './googleDrive'

/**
 * Optional mirror of form submissions into Google Sheets — one spreadsheet per
 * form, so a sheet's columns can be that form's actual questions rather than an
 * opaque JSON blob.
 *
 * Payload remains the source of truth; this is a convenience for officers who
 * would rather work in a spreadsheet. Everything here is inert unless
 * configured, so the site runs fine with no Google setup at all:
 *
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   the service account's address
 *   GOOGLE_PRIVATE_KEY             its PEM key (literal \n are unescaped)
 *   GOOGLE_SHEETS_ID               optional fallback sheet for forms with none
 *
 * Each form carries its own `sheetId`. Whichever spreadsheet is used must be
 * shared with the service account address as an Editor — that sharing *is* the
 * authorisation model (see `googleAuth.ts`). No OAuth consent flow and no
 * refresh tokens, which is why this was chosen over creating real Google Forms
 * (a service account cannot usefully own one).
 */

/** Fixed columns that lead every sheet, before the form's own questions. */
const BASE_HEADERS = ['Submission ID', 'Submitted At', 'Name', 'Email'] as const

export function sheetsCredentialsPresent(): boolean {
  return googleCredentialsPresent()
}

async function sheetsFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken(SHEETS_SCOPE)
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}

/** Current header row, or an empty list when the sheet is untouched. */
async function readHeaders(sheetId: string): Promise<string[]> {
  const res = await sheetsFetch(`${sheetId}/values/1:1`)
  if (!res.ok) {
    throw new Error(`Reading sheet headers failed (${res.status}): ${await res.text()}`)
  }
  const json = (await res.json()) as { values?: string[][] }
  return json.values?.[0] ?? []
}

async function writeHeaders(sheetId: string, headers: string[]): Promise<void> {
  const res = await sheetsFetch(`${sheetId}/values/1:1?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [headers] }),
  })
  if (!res.ok) {
    throw new Error(`Writing sheet headers failed (${res.status}): ${await res.text()}`)
  }
}

async function appendRow(sheetId: string, values: string[]): Promise<void> {
  const res = await sheetsFetch(
    `${sheetId}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [values] }) },
  )
  if (!res.ok) {
    throw new Error(`Sheets append failed (${res.status}): ${await res.text()}`)
  }
}

/** A1 column letter for a zero-based index (0 → A, 26 → AA). */
function columnLetter(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

/**
 * Map of Submission ID → 1-based sheet row, read from whichever column holds
 * the ids.
 *
 * This is what makes the sync idempotent against the sheet itself rather than
 * against `sheetSyncedAt` alone. The flag is written in a second call after the
 * row lands, so an append that succeeds while the flag write fails — or two
 * cron runs overlapping — would otherwise re-append the same submission.
 */
async function readRowIndex(sheetId: string, headers: string[]): Promise<Map<string, number>> {
  const idColumn = headers.indexOf('Submission ID')
  const index = new Map<string, number>()
  if (idColumn === -1) return index

  const letter = columnLetter(idColumn)
  const res = await sheetsFetch(`${sheetId}/values/${letter}:${letter}`)
  if (!res.ok) {
    throw new Error(`Reading sheet ids failed (${res.status}): ${await res.text()}`)
  }

  const json = (await res.json()) as { values?: string[][] }
  const column = json.values ?? []
  // Row 1 is the header; data starts at row 2.
  for (let i = 1; i < column.length; i += 1) {
    const id = column[i]?.[0]?.trim()
    if (id) index.set(id, i + 1)
  }
  return index
}

/** Overwrite one existing row, so a re-synced submission corrects itself. */
async function writeRow(sheetId: string, row: number, values: string[]): Promise<void> {
  const range = `A${row}:${columnLetter(values.length - 1)}${row}`
  const res = await sheetsFetch(`${sheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [values] }),
  })
  if (!res.ok) {
    throw new Error(`Sheets row update failed (${res.status}): ${await res.text()}`)
  }
}

/**
 * The form's answerable questions, in order. `image` rows are decoration the
 * officer placed between questions — they hold no answer, so they get no
 * column.
 */
function questionLabels(form: Form): string[] {
  const labels: string[] = []
  for (const step of form.steps ?? []) {
    for (const field of step.fields ?? []) {
      if (field.fieldType === 'image') continue
      if (field.label && !labels.includes(field.label)) labels.push(field.label)
    }
  }
  return labels
}

/** Labels whose answer is a Drive file id rather than text. */
function uploadLabels(form: Form): Set<string> {
  const labels = new Set<string>()
  for (const step of form.steps ?? []) {
    for (const field of step.fields ?? []) {
      if (field.fieldType === 'imageUpload' && field.label) labels.add(field.label)
    }
  }
  return labels
}

function cellValue(answer: unknown, isUpload = false): string {
  if (answer === undefined || answer === null) return ''
  if (Array.isArray(answer)) {
    return answer.map((a) => cellValue(a, isUpload)).join(', ')
  }
  // A bare Drive id is useless in a spreadsheet; officers want the link.
  if (isUpload && typeof answer === 'string' && answer !== '') return driveViewUrl(answer)
  return String(answer)
}

/**
 * Ensure the sheet's header row covers every column we are about to write, and
 * return it.
 *
 * Columns are matched by header text, never by position, and new questions are
 * appended to the right. So editing a form mid-run cannot change what an older
 * row's columns mean — the failure mode that makes spreadsheet mirrors
 * untrustworthy.
 */
async function reconcileHeaders(sheetId: string, wanted: string[]): Promise<string[]> {
  const existing = await readHeaders(sheetId)

  if (existing.length === 0) {
    await writeHeaders(sheetId, wanted)
    return wanted
  }

  const missing = wanted.filter((h) => !existing.includes(h))
  if (missing.length === 0) return existing

  const merged = [...existing, ...missing]
  await writeHeaders(sheetId, merged)
  return merged
}

export interface SheetSyncResult {
  synced: number
  failed: number
  skipped?: string
}

function resolveSheetId(form: Form): string | null {
  return form.sheetId?.trim() || process.env.GOOGLE_SHEETS_ID?.trim() || null
}

/**
 * Push submissions that have not reached their form's sheet yet.
 *
 * Idempotent: a submission is only marked synced once its row is written, and
 * the submission id leads every row, so a re-run can never double-append.
 * Deliberately not done during submit — a slow or rate-limited Sheets call
 * should never make a student wait, nor risk their response if Google is down.
 */
export async function syncPendingSubmissions(limit = 200): Promise<SheetSyncResult> {
  if (!sheetsCredentialsPresent()) {
    return { synced: 0, failed: 0, skipped: 'Google service account is not configured' }
  }

  const payload = await getPayload({ config })
  const pending = await payload.find({
    collection: 'form-submissions',
    where: { sheetSyncedAt: { exists: false } },
    limit,
    depth: 1,
    sort: 'createdAt',
    overrideAccess: true,
  })

  if (pending.docs.length === 0) return { synced: 0, failed: 0 }

  // Group by form so headers are reconciled once per sheet, not per row.
  const byForm = new Map<number, { form: Form; submissions: FormSubmission[] }>()
  for (const submission of pending.docs) {
    const form = submission.form
    if (typeof form !== 'object' || form === null) continue
    const entry = byForm.get(form.id) ?? { form, submissions: [] }
    entry.submissions.push(submission)
    byForm.set(form.id, entry)
  }

  let synced = 0
  let failed = 0

  for (const { form, submissions } of byForm.values()) {
    const sheetId = resolveSheetId(form)
    if (!sheetId) continue // this form simply isn't mirrored

    const uploads = uploadLabels(form)

    let headers: string[]
    let rowIndex: Map<string, number>
    try {
      headers = await reconcileHeaders(sheetId, [...BASE_HEADERS, ...questionLabels(form)])
      rowIndex = await readRowIndex(sheetId, headers)
    } catch (error) {
      console.error(`[Sheets] Header setup failed for form "${form.slug}":`, error)
      failed += submissions.length
      continue
    }

    for (const submission of submissions) {
      try {
        const answers = (submission.answersByLabel ?? {}) as Record<string, unknown>
        const values = headers.map((header) => {
          switch (header) {
            case 'Submission ID':
              return String(submission.id)
            case 'Submitted At':
              return submission.createdAt
            case 'Name':
              return submission.submitterName ?? ''
            case 'Email':
              return submission.submitterEmail ?? ''
            default:
              return cellValue(answers[header], uploads.has(header))
          }
        })

        // Upsert on Submission ID: a row already carrying this id is rewritten
        // in place, so re-syncing an edited response corrects the sheet rather
        // than adding a second row for the same person.
        const existingRow = rowIndex.get(String(submission.id))
        if (existingRow) {
          await writeRow(sheetId, existingRow, values)
        } else {
          await appendRow(sheetId, values)
        }

        await payload.update({
          collection: 'form-submissions',
          id: submission.id,
          overrideAccess: true,
          data: { sheetSyncedAt: new Date().toISOString() },
        })
        synced += 1
      } catch (error) {
        console.error(`[Sheets] Sync failed for submission ${submission.id}:`, error)
        failed += 1
      }
    }
  }

  return { synced, failed }
}
