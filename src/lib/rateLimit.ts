import Redis from 'ioredis'

/**
 * Shared rate limiter for the public write paths - form submissions and form
 * uploads.
 *
 * Backed by Redis so the count is shared. The in-process `Map` this replaces
 * reset on every deploy and lived per lambda instance, so the real ceiling was
 * the configured limit multiplied by however many instances Vercel happened to
 * be running.
 *
 * Redis is treated as best-effort: if it is unreachable the request is allowed
 * through against an in-memory count rather than rejected. A cache outage
 * should not stop the club taking registrations, and the fallback still blunts
 * a flood hitting one instance.
 */

const REDIS_URL = process.env.REDIS_URL

/**
 * One client per instance, created lazily. `lazyConnect` keeps module import
 * free of network work, which matters because this file is pulled into a server
 * action; the retry ceiling stops a dead endpoint from stalling a submission
 * behind repeated reconnects.
 */
let client: Redis | null = null
let clientUnavailable = false

function getClient(): Redis | null {
  if (clientUnavailable || !REDIS_URL) return null

  if (!client) {
    client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      // Give up rather than reconnect forever; the caller falls back.
      retryStrategy: (times) => (times > 2 ? null : 200),
    })
    // Without a listener an emitted 'error' is an unhandled exception that
    // takes the whole function down.
    client.on('error', () => {
      clientUnavailable = true
    })
  }

  return client
}

/** Per-instance fallback, used only when Redis is unset or unreachable. */
const localHits = new Map<string, number[]>()

function localLimited(key: string, windowMs: number, max: number): boolean {
  const now = Date.now()
  const hits = (localHits.get(key) ?? []).filter((t) => now - t < windowMs)
  hits.push(now)
  localHits.set(key, hits)

  if (localHits.size > 500) {
    for (const [k, v] of localHits) {
      if (v.every((t) => now - t > windowMs)) localHits.delete(k)
    }
  }

  return hits.length > max
}

export interface RateLimitOptions {
  /** Stable identifier for the caller and the thing being limited. */
  key: string
  windowMs: number
  /** Requests allowed within the window. The call that exceeds it is blocked. */
  max: number
}

/**
 * True when this call should be rejected.
 *
 * Sliding window over a sorted set: drop timestamps older than the window, add
 * this one, count what is left. One round trip, and no fixed-window edge where
 * twice the limit slips through either side of a boundary.
 */
export async function isRateLimited({ key, windowMs, max }: RateLimitOptions): Promise<boolean> {
  const redis = getClient()
  if (!redis) return localLimited(key, windowMs, max)

  const redisKey = `rl:${key}`
  const now = Date.now()

  try {
    const results = await redis
      .pipeline()
      .zremrangebyscore(redisKey, 0, now - windowMs)
      .zadd(redisKey, now, `${now}-${Math.random().toString(36).slice(2)}`)
      .zcard(redisKey)
      .pexpire(redisKey, windowMs)
      .exec()

    // A pipeline reports per-command failures in the tuple rather than
    // rejecting, so `exec()` resolving is not success. Treating it as success
    // returned "allowed" without counting anywhere - no Redis tally and no
    // local one either, which is an unlimited path rather than a degraded one.
    const failed = !results || results.some(([error]) => error)
    const count = results?.[2]?.[1]

    if (failed || typeof count !== 'number') {
      clientUnavailable = true
      return localLimited(key, windowMs, max)
    }

    return count > max
  } catch {
    // Never let a cache problem become a submission failure.
    clientUnavailable = true
    return localLimited(key, windowMs, max)
  }
}

/** Whether a shared store is actually in play - surfaced for logging/tests. */
export function rateLimitBackend(): 'redis' | 'memory' {
  return getClient() ? 'redis' : 'memory'
}
