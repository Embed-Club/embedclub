import { describe, expect, it } from 'vitest'
import { isRateLimited, rateLimitBackend } from '../../src/lib/rateLimit'

const key = () => `selftest:${Date.now()}:${Math.random().toString(36).slice(2)}`

describe('rate limiter', () => {
  it('reports the redis backend when REDIS_URL is set', () => {
    expect(rateLimitBackend()).toBe('redis')
  })

  it('allows up to max then blocks', async () => {
    const k = key()
    const opts = { key: k, windowMs: 60_000, max: 3 }
    const seen: boolean[] = []
    for (let i = 0; i < 5; i++) seen.push(await isRateLimited(opts))
    expect(seen).toEqual([false, false, false, true, true])
  })

  it('keeps separate keys independent', async () => {
    const a = { key: key(), windowMs: 60_000, max: 1 }
    const b = { key: key(), windowMs: 60_000, max: 1 }
    expect(await isRateLimited(a)).toBe(false)
    expect(await isRateLimited(a)).toBe(true)
    expect(await isRateLimited(b)).toBe(false)
  })

  it('lets the window expire', async () => {
    const k = key()
    const opts = { key: k, windowMs: 1_000, max: 1 }
    expect(await isRateLimited(opts)).toBe(false)
    expect(await isRateLimited(opts)).toBe(true)
    await new Promise((r) => setTimeout(r, 1_200))
    expect(await isRateLimited(opts)).toBe(false)
  })
})
