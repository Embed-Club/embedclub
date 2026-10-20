import { authorizeJarvis, jarvisResources } from '@/lib/jarvisApi'
import config from '@/payload/payload.config'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

/**
 * Club data for Club Jarvis, the club's offline voice assistant.
 *
 * `GET /api/jarvis/<resource>` where resource is one of the keys in
 * `jarvisResources` - events, members, projects, resources, tutorials,
 * achievements, digest, documents. See `lib/jarvisApi` for why the shapes are
 * flattened here instead of letting Jarvis read Payload's own REST API.
 *
 * One dynamic segment rather than eight route files: every resource needs the
 * same auth, the same rate limit and the same error handling, and the handler
 * map is already the allowlist.
 */

// Answers change whenever an editor publishes, and the token check has to run
// per request - nothing here is safe to prerender or cache.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const denied = await authorizeJarvis(req)
  if (denied) return denied.response

  const { resource } = await params
  const handler = jarvisResources[resource]

  if (!handler) {
    return Response.json(
      { error: `Unknown resource. Available: ${Object.keys(jarvisResources).join(', ')}.` },
      { status: 404 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const data = await handler(payload, req.nextUrl.searchParams)
    return Response.json(data)
  } catch (error) {
    // The assistant speaks its failures out loud, so keep the public message
    // short and generic and leave the detail in the server log.
    console.error(`[Jarvis API] ${resource} failed:`, error)
    return Response.json({ error: 'Could not read club data.' }, { status: 500 })
  }
}
