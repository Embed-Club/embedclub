/**
 * One-time consent flow that mints the Drive refresh token.
 *
 *   pnpm drive:auth
 *
 * Why this exists: the site needs to write respondent uploads into a Drive
 * folder, and a service account cannot own files. The usual workaround is
 * domain-wide delegation, which lets the service account act as *any* account
 * in the Workspace — far more authority than a club website should hold, and
 * it needs a Workspace admin to grant. A refresh token is granted by the club
 * account to itself: it reaches that one Drive and nothing else, and anybody
 * with the account can do it unaided.
 *
 * Run it, sign in as the account that owns the uploads folder, click Allow.
 * The refresh token it prints goes in `.env` as GOOGLE_DRIVE_REFRESH_TOKEN.
 * For an Internal consent screen the token does not expire, so this is run
 * once and then forgotten.
 *
 * Requires GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET from a
 * "Desktop app" OAuth client in the same Cloud project.
 *
 * Plain ESM rather than TypeScript on purpose: it runs under bare `node`, so
 * it needs no TS runner (the repo has none installed) and no new dependency.
 */
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/drive'
// Loopback redirect: Google allows any port on 127.0.0.1 for Desktop clients,
// so nothing has to be registered in the console beyond the client itself.
const PORT = 53682
const REDIRECT_URI = `http://127.0.0.1:${PORT}`

/**
 * Minimal .env reader. This runs outside Next, which is what normally loads
 * the file, and pulling in a dependency for six lines is not worth it.
 */
function loadEnv() {
  if (!fs.existsSync('.env')) return
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (match && !process.env[match[1]]) {
      // Trailing whitespace is easy to introduce when appending a secret from
      // a shell, and an invisible space at the end of a client secret fails
      // authentication with no useful error.
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

function openBrowser(url) {
  // `start` is a cmd builtin, hence the shell; harmless elsewhere.
  const command =
    process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  spawn(command, ['', url], { shell: true, stdio: 'ignore', detached: true }).unref()
}

async function main() {
  loadEnv()

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error(
      'Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in .env.\n' +
        'Create a "Desktop app" OAuth client in the Cloud project first.',
    )
    process.exit(1)
  }

  // Guards against another page on localhost feeding us a code.
  const state = crypto.randomBytes(16).toString('hex')

  const authUrl = `${AUTH_URL}?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    // offline + consent is what makes Google return a *refresh* token rather
    // than only an access token. Without prompt=consent it is omitted on every
    // authorisation after the first, which is a confusing way to fail.
    access_type: 'offline',
    prompt: 'consent',
    state,
  })}`

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', REDIRECT_URI)
      const returnedCode = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

      if (error || !returnedCode) {
        res.end(
          `<p>Authorisation failed: ${error ?? 'no code returned'}. You can close this tab.</p>`,
        )
        server.close()
        reject(new Error(error ?? 'No authorisation code returned'))
        return
      }
      if (url.searchParams.get('state') !== state) {
        res.end('<p>State mismatch — ignoring this response. You can close this tab.</p>')
        server.close()
        reject(new Error('State mismatch'))
        return
      }

      res.end('<p>Done. Return to the terminal — you can close this tab.</p>')
      server.close()
      resolve(returnedCode)
    })

    server.listen(PORT, '127.0.0.1', () => {
      console.log('\nSign in as the account that owns the uploads folder, then click Allow.')
      console.log('If a browser did not open, paste this into one:\n')
      console.log(`${authUrl}\n`)
      openBrowser(authUrl)
    })
    server.on('error', reject)
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    console.error(`Token exchange failed (${res.status}):`, await res.text())
    process.exit(1)
  }

  const json = await res.json()
  if (!json.refresh_token) {
    console.error(
      'Google returned no refresh token. That happens when this account has already\n' +
        'authorised the app; revoke it at https://myaccount.google.com/permissions and retry.',
    )
    process.exit(1)
  }

  // Confirm the token works and say whose Drive it reaches, so a wrong account
  // is caught here rather than after the first respondent uploads a photo.
  const about = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
    headers: { Authorization: `Bearer ${json.access_token}` },
  })
  const who = about.ok ? (await about.json()).user?.emailAddress : undefined

  console.log(`\nAuthorised${who ? ` as ${who}` : ''}. Add this line to .env:\n`)
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${json.refresh_token}\n`)
  console.log('Then restart the dev server. Treat it like a password — it is one.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
