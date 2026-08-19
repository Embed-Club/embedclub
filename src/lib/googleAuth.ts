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
 * account address as an Editor - that sharing *is* the authorisation model.
 * No OAuth consent flow and no refresh tokens.
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

export function googleCredentialsPresent(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
}

/**
 * Whether a user-consented OAuth refresh token is configured.
 *
 * This is the preferred way to reach Drive. A service account cannot own files,
 * and the usual fix - domain-wide delegation - hands it the ability to act as
 * *any* account in the domain, which is a college-wide risk taken to solve a
 * club-website problem. A refresh token is granted by one account, to one
 * account: even if it leaks, it reaches nothing but that Drive.
 */
export function oauthRefreshTokenPresent(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  )
}

/** Access tokens minted from the refresh token, cached until they expire. */
let cachedOauthToken: { value: string; expiresAt: number } | null = null

/**
 * Trade the stored refresh token for an access token.
 *
 * The refresh token itself does not expire for an Internal app, so there is no
 * re-consent step to babysit - `scripts/getDriveRefreshToken.ts` is run once
 * and never again unless the token is revoked.
 */
export async function oauthAccessToken(): Promise<string> {
  if (cachedOauthToken && cachedOauthToken.expiresAt > Date.now() + 30_000) {
    return cachedOauthToken.value
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN as string,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    // `invalid_grant` here means the token was revoked, or the consent screen
    // is still in Testing (where Google expires refresh tokens after 7 days).
    throw new Error(`Google refresh-token exchange failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedOauthToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return cachedOauthToken.value
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Tokens are scope-bound, so they are cached per scope rather than globally. */
const cachedTokens = new Map<string, { value: string; expiresAt: number }>()

export async function accessToken(scope: string): Promise<string> {
  const cached = cachedTokens.get(scope)
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.value

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string
  // Env vars can't hold real newlines, so the key is stored with literal \n.
  const key = (process.env.GOOGLE_PRIVATE_KEY as string).replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({ iss: email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
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
  cachedTokens.set(scope, token)
  return token.value
}
