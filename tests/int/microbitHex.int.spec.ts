import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildHex } from '@/lib/microbit/hexBuilder'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * The hex builder is what turns a student's script into something the board
 * can run. Worth a real test: a broken hex fails silently on the board (it
 * just does nothing), which is the worst kind of failure in a classroom.
 */
describe('buildHex', () => {
  const originalFetch = globalThis.fetch

  beforeAll(() => {
    // The runtimes are static files in public/; serve them from disk.
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const file = path.join(process.cwd(), 'public', url)
      return new Response(readFileSync(file, 'utf8'), { status: 200 })
    }) as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('embeds main.py into a V1, V2 and universal hex', async () => {
    const script = 'from microbit import *\ndisplay.show(Image.HEART)\n'
    const hex = await buildHex(script)

    const v1 = hex.forBoard('V1')
    const v2 = hex.forBoard('V2')
    const universal = hex.universal()

    // Intel hex records; the universal one carries both boards' blocks.
    expect(v1.startsWith(':')).toBe(true)
    expect(v2.startsWith(':')).toBe(true)
    expect(universal.length).toBeGreaterThan(v1.length)
    expect(universal.length).toBeGreaterThan(v2.length)

    // The script lands in the filesystem region as bytes, so the hex text
    // itself changes with the script - same runtime, different program.
    const other = await buildHex('from microbit import *\ndisplay.show(Image.SAD)\n')
    expect(other.forBoard('V1')).not.toBe(v1)
  })

  it('refuses a script too big for the board filesystem', async () => {
    const huge = `x = "${'a'.repeat(200_000)}"\n`
    await expect(buildHex(huge)).rejects.toThrow()
  })
})
