import { driveConfigured, getDriveFileMeta, getDriveFileStream } from '@/lib/googleDrive'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/**
 * Admin-only proxy for a respondent's attachment.
 *
 * The Drive files are deliberately left unshared, so there is no public link to
 * leak - someone's payment screenshot should not be readable by anyone who
 * guesses a URL. members view them through here instead, authenticated by the
 * same Payload session that got them into the admin panel.
 *
 * The `appProperties` stamp is re-checked so this cannot be turned into a
 * general-purpose reader for the club's whole Drive.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await ctx.params

  if (!driveConfigured()) {
    return NextResponse.json({ error: 'Drive is not configured.' }, { status: 503 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const meta = await getDriveFileMeta(fileId)
    if (!meta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!meta.formSlug || !meta.fieldId) {
      return NextResponse.json({ error: 'Not a form attachment' }, { status: 403 })
    }

    const upstream = await getDriveFileStream(fileId)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Could not read the file' }, { status: 502 })
    }

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': meta.mimeType,
        'Content-Disposition': `inline; filename="${meta.name.replace(/"/g, '')}"`,
        // Private: this is somebody's uploaded photo behind an admin session.
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('[Forms] Attachment fetch failed:', error)
    return NextResponse.json({ error: 'Could not read the file' }, { status: 502 })
  }
}
