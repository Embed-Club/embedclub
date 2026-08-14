import { extractPlaceholders } from '@/lib/certificatePlaceholders'
import { driveConfigured, exportDriveFileText } from '@/lib/googleDrive'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/**
 * Which `{{markers}}` a certificate template contains.
 *
 * Admin-only, and it reads an arbitrary Drive file id supplied by the caller —
 * so it is deliberately narrow about what it returns: the marker names it
 * found, never the document's text. Otherwise this would be a way for any
 * logged-in officer to read the contents of any file the site can reach.
 *
 * The id is accepted as a full Slides URL too, since that is what an officer
 * has in their clipboard.
 */
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!driveConfigured()) {
    return NextResponse.json({ error: 'Google Drive is not configured.' }, { status: 503 })
  }

  const raw = req.nextUrl.searchParams.get('templateId')?.trim()
  if (!raw) return NextResponse.json({ error: 'No template given.' }, { status: 400 })

  const match = raw.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
  const templateId = match ? match[1] : raw

  try {
    const text = await exportDriveFileText(templateId)
    return NextResponse.json({ placeholders: extractPlaceholders(text) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Certificates] Template scan failed:', message)
    // The message here is one of googleDrive's translated explanations, so it
    // is safe and useful to show an officer verbatim.
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
