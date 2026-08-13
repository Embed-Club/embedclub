import 'server-only'

import crypto from 'node:crypto'
import {
  DRIVE_SCOPE,
  accessToken,
  googleCredentialsPresent,
  oauthAccessToken,
  oauthRefreshTokenPresent,
} from './googleAuth'

/**
 * Google Drive is where files that *respondents* attach to a form are kept —
 * deliberately not the S3/Supabase bucket the site's own media lives in.
 *
 * The reasoning: officer-authored images are site content and belong in the
 * `form-media` collection, but respondent uploads are unvetted third-party
 * files whose volume follows however many people fill the form in. Keeping
 * them in a Drive folder the club already owns means storage is somebody
 * else's problem, and officers can open the folder directly.
 *
 * Each form carries its own `driveFolderId`; `GOOGLE_DRIVE_FOLDER_ID` is the
 * fallback for forms that set none. The folder has to be reachable by whoever
 * the site is authorised as — in practice, owned by that account.
 *
 * A service account has no storage quota of its own, and Drive refuses any
 * write where the new file would end up owned by one — every upload 403s with
 * "Service Accounts do not have storage quota". So the file needs a real
 * owner. Two ways, and the first is what this site uses:
 *
 *   1. **The club account's own OAuth refresh token**
 *      (`GOOGLE_DRIVE_REFRESH_TOKEN`, minted by `pnpm drive:auth`). That
 *      account consents once, to itself, and uploads are owned by it. The
 *      credential reaches exactly one Drive and nothing else.
 *
 *   2. **A Shared Drive folder**, where files are owned by the drive rather
 *      than any person, with the service account as a Content Manager — hence
 *      `supportsAllDrives` on every call. Needs a Workspace edition that
 *      includes Shared Drives, which pace.edu.in's does not.
 *
 * Domain-wide delegation is the third way the internet will suggest. It works,
 * but it lets this service account act as *any* account in the domain for
 * Drive — a college-wide capability created to solve a club-website problem —
 * and it needs a Workspace admin. Deliberately not used.
 */
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const FILES_URL = 'https://www.googleapis.com/drive/v3/files'

/** What a form upload records about itself, so a submit can verify it. */
export interface DriveFileMeta {
  id: string
  name: string
  mimeType: string
  size?: number
  /** Set by us at upload time — which form and question this file belongs to. */
  formSlug?: string
  fieldId?: string
}

export function driveConfigured(): boolean {
  return oauthRefreshTokenPresent() || googleCredentialsPresent()
}

/** The folder a given form's uploads land in, or null when none is configured. */
export function resolveDriveFolderId(formFolderId?: string | null): string | null {
  return formFolderId?.trim() || process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  // The refresh token wins when present: it is the narrowest credential we
  // have, so falling back to the service account would be a downgrade. The
  // service account path only reaches a Shared Drive.
  const token = oauthRefreshTokenPresent()
    ? await oauthAccessToken()
    : await accessToken(DRIVE_SCOPE)

  return fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  })
}

/**
 * Google's 403s here are configuration problems an officer can actually fix,
 * but they arrive as a wall of JSON. Pull out the one line worth logging.
 */
function explainDriveError(status: number, body: string): string {
  if (body.includes('storageQuotaExceeded')) {
    return 'no GOOGLE_DRIVE_REFRESH_TOKEN is set, so this fell back to the service account, which cannot own files on My Drive. Run `pnpm drive:auth`'
  }
  if (body.includes('has not been used in project') || body.includes('accessNotConfigured')) {
    return 'the Google Drive API is not enabled on the Cloud project'
  }
  if (status === 404) {
    return 'the folder id is wrong, or that folder is not reachable by the authorised account'
  }
  return body
}

function parseMeta(json: Record<string, unknown>): DriveFileMeta {
  const props = (json.appProperties ?? {}) as Record<string, string>
  return {
    id: String(json.id),
    name: String(json.name ?? ''),
    mimeType: String(json.mimeType ?? 'application/octet-stream'),
    size: json.size === undefined ? undefined : Number(json.size),
    formSlug: props.formSlug,
    fieldId: props.fieldId,
  }
}

/**
 * Upload one file into a form's folder.
 *
 * `appProperties` carries the form slug and question id back out again. The
 * browser only ever hands the server a file *id* at submit time, so that stamp
 * is what stops someone pasting an unrelated id into a submission.
 */
export async function uploadFormFile(args: {
  folderId: string
  fileName: string
  mimeType: string
  bytes: ArrayBuffer
  formSlug: string
  fieldId: string
}): Promise<DriveFileMeta> {
  const metadata = {
    name: args.fileName,
    parents: [args.folderId],
    appProperties: { formSlug: args.formSlug, fieldId: args.fieldId },
  }

  // multipart/related: JSON metadata part, then the bytes.
  const boundary = `embedclub-${crypto.randomUUID()}`
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${args.mimeType}\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  const body = Buffer.concat([head, Buffer.from(args.bytes), tail])

  const res = await driveFetch(
    `${UPLOAD_URL}?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,appProperties`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: new Uint8Array(body),
    },
  )

  if (!res.ok) {
    throw new Error(
      `Drive upload failed (${res.status}): ${explainDriveError(res.status, await res.text())}`,
    )
  }
  return parseMeta((await res.json()) as Record<string, unknown>)
}

export async function getDriveFileMeta(fileId: string): Promise<DriveFileMeta | null> {
  const res = await driveFetch(
    `${FILES_URL}/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,size,appProperties`,
  )
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Drive metadata failed (${res.status}): ${await res.text()}`)
  }
  return parseMeta((await res.json()) as Record<string, unknown>)
}

/** Raw bytes, for the admin-only proxy route. */
export async function getDriveFileStream(fileId: string): Promise<Response> {
  return driveFetch(`${FILES_URL}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`)
}

/** Human-facing Drive link — what gets written into the Sheets mirror. */
export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const res = await driveFetch(
    `${FILES_URL}/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: 'DELETE',
    },
  )
  if (!res.ok && res.status !== 404) {
    throw new Error(`Drive delete failed (${res.status}): ${await res.text()}`)
  }
}
