import 'server-only'

/**
 * Client for the Apps Script certificate sender (`scripts/appsScript/
 * certificateSender.gs`).
 *
 * The script does the actual work — building the PDF from a Google Slides
 * template and mailing it. It sends as the account that deployed it, so the
 * club's address is used with no SMTP host and no app password, which is what
 * makes this workable on a Workspace tenant we don't administer.
 *
 * This site keeps the decisions: which form issues certificates, when they go
 * out, who has already received one, and what to retry.
 *
 *   APPS_SCRIPT_URL      the web app's /exec URL
 *   APPS_SCRIPT_SECRET   must match SHARED_SECRET inside the script
 */
export interface CertificateRequest {
  /** Printed wherever {{name}} appears on the certificate itself. */
  certificateName: string
  /** Used in the email greeting/body — independently case-formed, per form. */
  emailName: string
  email: string
  formTitle: string
  /** Overrides the script's default template, for forms with their own design. */
  templateId?: string
  /** Overrides the script's default subject. {{event}} is resolved on the site side. */
  emailSubject?: string
  /** Overrides the script's default body. {{name}}/{{event}} resolved on the site side. */
  emailBody?: string
}

export function appsScriptConfigured(): boolean {
  return Boolean(process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET)
}

/**
 * Send one certificate. Throws with a useful message on failure so the caller
 * can record it against the recipient and retry later.
 */
export async function sendCertificate(request: CertificateRequest): Promise<void> {
  const url = process.env.APPS_SCRIPT_URL
  const secret = process.env.APPS_SCRIPT_SECRET

  if (!url || !secret) {
    throw new Error('Apps Script is not configured (APPS_SCRIPT_URL / APPS_SCRIPT_SECRET)')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Apps Script web apps answer with a 302 to script.googleusercontent.com;
    // fetch follows it by default, which is what we want.
    redirect: 'follow',
    body: JSON.stringify({ secret, ...request }),
  })

  if (!res.ok) {
    throw new Error(`Apps Script returned ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  // A misconfigured script still answers 200 with an error payload, so the
  // body is the real success signal — not the status code.
  const text = await res.text()
  let payload: { ok?: boolean; error?: string }
  try {
    payload = JSON.parse(text) as { ok?: boolean; error?: string }
  } catch {
    throw new Error(`Apps Script returned a non-JSON response: ${text.slice(0, 300)}`)
  }

  if (!payload.ok) {
    throw new Error(payload.error || 'Apps Script reported an unspecified failure')
  }
}
