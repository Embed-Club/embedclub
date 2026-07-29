import { dispatchDueCertificates } from '@/lib/certificateDispatch'
import { syncPendingSubmissions } from '@/lib/googleSheets'
import { type NextRequest, NextResponse } from 'next/server'

// Sending is real work against SMTP and the DB — never prerender or cache it.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Scheduled worker: emails any certificate that is due, then pushes any
 * unsynced submissions to the Google Sheet (if that is configured at all).
 *
 * Guarded by `CRON_SECRET`. Vercel Cron sends it as `Authorization: Bearer
 * <secret>`; the same secret in a `?secret=` query works for manual runs.
 * Without the env var set the route refuses outright rather than defaulting
 * open — this endpoint sends mail to real people.
 */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = req.headers.get('authorization')
  if (header === `Bearer ${secret}`) return true

  return req.nextUrl.searchParams.get('secret') === secret
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const certificates = await dispatchDueCertificates()
    const sheets = await syncPendingSubmissions()
    return NextResponse.json({ ok: true, certificates, sheets })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Cron] Certificate run failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
