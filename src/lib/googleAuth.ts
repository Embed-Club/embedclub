import 'server-only'

import crypto from 'node:crypto'

/**
 * Service-account auth shared by the Google integrations (Sheets mirror, Drive
 * uploads).
 *
 * A self-signed JWT is exchanged for an access token via node:crypto, so no
 * Google SDK is pulled in for a handful of REST calls. Everything is inert
 * unless configured, so the site runs fine with no Google setup at all:
 *
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   the service account's address
 *   GOOGLE_PRIVATE_KEY             its PEM key (literal \n are unescaped)
 *
 * Whichever spreadsheet or folder is used must be shared with the service
 * account address as an Editor — that sharing *is* the authorisation model.
 * No OAuth consent flow and no refresh tokens.
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

export function googleCredentialsPresent(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Tokens are bound to both the scope and whoever they act as, so they are
 * cached per (scope, subject) rather than globally.
 */
const cachedTokens = new Map<string, { value: string; expiresAt: number }>()

/**
 * @param subject Optional user to impersonate (domain-wide delegation). Without
 *   it the token acts as the service account itself, which is fine for Sheets
 *   but cannot own files — see `googleDrive.ts`.
 */
export async function accessToken(scope: string, subject?: string): Promise<string> {
  const cacheKey = `${scope}|${subject ?? ''}`
  const cached = cachedTokens.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.value

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string
  // Env vars can't hold real newlines, so the key is stored with literal \n.
  const key = (process.env.GOOGLE_PRIVATE_KEY as string).replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: email,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
      // `sub` is what turns this into "act as that person". Google rejects it
      // unless a Workspace admin has granted this service account's client id
      // domain-wide delegation for the scope being asked for.
      ...(subject ? { sub: subject } : {}),
    }),
  )
  const signature = base64url(crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), key))

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
  })

  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  const token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  cachedTokens.set(cacheKey, token)
  return token.value
}
