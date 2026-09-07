import { isRateLimited } from '@/lib/rateLimit'
import { TRACKED_EVENTS, TRACK_DETAIL_MAX_LENGTH } from '@/lib/trackEvent'
import config from '@/payload/payload.config'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

// Writes a row on every call - never prerender or cache.
export const dynamic = 'force-dynamic'

/**
 * Counts one anonymous action. See `lib/trackEvent` for what is sent and why
 * this exists rather than Vercel custom events (Pro plan only).
 *
 * Public by necessity - visitors are not logged in - so the blast radius is
 * held down by what it will accept rather than by who is calling: the event
 * name has to be one of a fixed handful, `detail` and `path` are truncated
 * strings, everything else in the body is discarded, and one IP gets a bounded
 * number of events a minute.
 *
 * The IP is used for that limit and then dropped. It is never stored on the
 * row, which is what keeps these counts genuinely anonymous - see the
 * collection's own note.
 */

/** Room for a burst of copies while reading, not for a script. */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 40

/** Longest path stored, enough for any route on the site plus slug. */
const PATH_MAX_LENGTH = 200

const ALLOWED_EVENTS = new Set<string>(TRACKED_EVENTS)

/**
 * Always 204, whatever happened.
 *
 * A beacon cannot read the response and the visitor gets nothing either way,
 * so a rejected event is silently dropped rather than answered with a status
 * that tells a prober which names are real.
 */
const noContent = () => new Response(null, { status: 204 })

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (
    await isRateLimited({ key: `track:${ip}`, windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })
  ) {
    return noContent()
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return noContent()
  }

  if (typeof body !== 'object' || body === null) return noContent()

  const { name, detail, path } = body as Record<string, unknown>
  if (typeof name !== 'string' || !ALLOWED_EVENTS.has(name)) return noContent()

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'tracked-events',
      // The collection denies `create` to everything, so that the REST and
      // GraphQL endpoints cannot be used to write rows directly; this route is
      // the only writer, and it validates first.
      overrideAccess: true,
      data: {
        name,
        detail: typeof detail === 'string' ? detail.slice(0, TRACK_DETAIL_MAX_LENGTH) : undefined,
        path: typeof path === 'string' ? path.slice(0, PATH_MAX_LENGTH) : undefined,
      },
    })
  } catch (error) {
    // A dropped count is not worth a 500 to someone who is just reading a page.
    console.error('[Track] Error recording event:', error)
  }

  return noContent()
}
