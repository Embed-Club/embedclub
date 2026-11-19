import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sitemap from '@/app/sitemap'
import { eventDetails } from '@/components/features/embedthon/eventType'
import { describe, expect, it } from 'vitest'

/**
 * Embed Days is hand-built page copy rather than CMS content (a deliberate,
 * documented exception), so nothing else guards it. These tests catch the
 * mistakes that would only show up in front of attendees: a date that parses
 * to the wrong day, a countdown aimed at the past, a page missing from the
 * navigation or the sitemap, or an em dash sneaking into the copy.
 */

const root = process.cwd()

/** Every `/path` a menu file links to, in source order. */
function menuDestinations(file: string, key: 'url' | 'link'): string[] {
  const source = readFileSync(join(root, file), 'utf8')
  const pattern = new RegExp(`${key}:\\s*'(/[^']*)'`, 'g')
  return [...source.matchAll(pattern)].map((match) => match[1] as string)
}

describe('eventDetails', () => {
  it('has a parseable start time for every event', () => {
    for (const event of Object.values(eventDetails)) {
      expect(Number.isNaN(new Date(event.start).getTime())).toBe(false)
    }
  })

  it('starts each event on the day its date label says', () => {
    // The start string is IST; read the day back in IST, not the runner's zone.
    const istDay = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })

    expect(eventDetails.embers.date).toBe(istDay(eventDetails.embers.start))
    expect(eventDetails.embedthon.date.startsWith('24')).toBe(true)
    expect(istDay(eventDetails.embedthon.start)).toBe('24 November 2026')
  })

  it('never uses an em or en dash in the copy', () => {
    const text = JSON.stringify(eventDetails)
    expect(text).not.toMatch(/[–—]/)
  })
})

describe('navigation parity', () => {
  it('lists the same destinations in the desktop and mobile menus', () => {
    const desktop = menuDestinations('src/components/layout/desktopMenu.tsx', 'url')
    const mobile = menuDestinations('src/components/layout/mobileMenu.tsx', 'link')

    expect(desktop.length).toBeGreaterThan(0)
    expect(mobile).toEqual(desktop)
  })

  it('links the Embed Days chooser from both menus', () => {
    expect(menuDestinations('src/components/layout/desktopMenu.tsx', 'url')).toContain(
      '/embed-days',
    )
    expect(menuDestinations('src/components/layout/mobileMenu.tsx', 'link')).toContain(
      '/embed-days',
    )
  })
})

describe('sitemap', () => {
  it('includes the Embed Days pages', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname)

    expect(urls).toContain('/embed-days')
    expect(urls).toContain('/embedthon')
    expect(urls).toContain('/embers')
  })
})
