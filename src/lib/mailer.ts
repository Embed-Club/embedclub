import 'server-only'

import nodemailer from 'nodemailer'

/**
 * SMTP transport built entirely from env — nothing about the club's mail
 * account is baked into the repo (AGENTS.md §4). Configure with:
 *
 *   SMTP_HOST      e.g. smtp.gmail.com
 *   SMTP_PORT      e.g. 587
 *   SMTP_USER      the sending mailbox
 *   SMTP_PASSWORD  an app password, never the account password
 *   SMTP_FROM      optional display sender, defaults to SMTP_USER
 *
 * Note for Google Workspace tenants (e.g. pace.edu.in): app passwords require
 * 2-Step Verification on the account *and* the domain admin not having
 * disabled them. Test with a personal account first — if the club account is
 * locked down, this is the piece that has to change, not the rest.
 */
export interface MailAttachment {
  filename: string
  content: Buffer | Uint8Array
  contentType?: string
}

export function mailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  )
}

let cached: nodemailer.Transporter | null = null

function transport(): nodemailer.Transporter {
  if (cached) return cached
  if (!mailerConfigured()) {
    throw new Error('SMTP is not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD.')
  }

  const port = Number(process.env.SMTP_PORT)
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
  return cached
}

export async function sendMail(options: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: MailAttachment[]
}): Promise<void> {
  await transport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
      contentType: a.contentType,
    })),
  })
}

/** Prove the credentials work without sending anything. */
export async function verifyMailer(): Promise<void> {
  await transport().verify()
}
