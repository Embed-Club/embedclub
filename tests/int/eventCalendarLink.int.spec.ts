import { googleCalendarUrl, isUpcomingEvent } from '@/lib/eventUtils'
import { describe, expect, it } from 'vitest'

/**
 * The "Save the date" link on an event.
 *
 * Worth testing directly: nobody on the site can see this button until an
 * upcoming event exists in the CMS, and the failure mode - a reminder landing
 * on the wrong day - is invisible until it is sitting in someone's calendar on
 * the wrong date.
 */

/** The query string Google is handed, parsed back out. */
function params(url: string | null): URLSearchParams {
  if (!url) throw new Error('expected a url')
  return new URL(url).searchParams
}

describe('googleCalendarUrl', () => {
  it('builds an all-day entry ending the following day', () => {
    // Google's all-day range is end-exclusive, so a one-day event is
    // the 24th to the 25th.
    const url = googleCalendarUrl({
      title: 'IoT Application Design',
      eventDate: new Date(2026, 4, 25, 9, 30).toISOString(),
    })

    expect(params(url).get('dates')).toBe('20260525/20260526')
    expect(params(url).get('action')).toBe('TEMPLATE')
  })

  it('keeps the reminder on the day the page displays, not the UTC day', () => {
    // A late-evening event in a positive-offset zone is the *next* day in UTC,
    // and the previous day for a negative one. Either way the reminder must
    // match the date shown beside it, so the stamp comes from local parts.
    const late = new Date(2026, 4, 25, 23, 30)
    const early = new Date(2026, 4, 25, 0, 30)

    expect(
      params(googleCalendarUrl({ title: 'x', eventDate: late.toISOString() })).get('dates'),
    ).toBe('20260525/20260526')
    expect(
      params(googleCalendarUrl({ title: 'x', eventDate: early.toISOString() })).get('dates'),
    ).toBe('20260525/20260526')
  })

  it('pads single-digit months and days', () => {
    const url = googleCalendarUrl({ title: 'x', eventDate: new Date(2026, 0, 5, 12).toISOString() })
    expect(params(url).get('dates')).toBe('20260105/20260106')
  })

  it('carries the title, details and location through', () => {
    const url = googleCalendarUrl({
      title: 'ESP32 Cam Vision: Object Detection',
      eventDate: new Date(2026, 4, 25, 9).toISOString(),
      details: 'Build and deploy real-time object detection models.',
      location: 'Unix Lab, PA College of Engineering',
    })

    expect(params(url).get('text')).toBe('ESP32 Cam Vision: Object Detection')
    expect(params(url).get('details')).toBe('Build and deploy real-time object detection models.')
    expect(params(url).get('location')).toBe('Unix Lab, PA College of Engineering')
  })

  it('omits details and location rather than sending empty ones', () => {
    const url = googleCalendarUrl({ title: 'x', eventDate: new Date(2026, 4, 25).toISOString() })
    expect(params(url).has('details')).toBe(false)
    expect(params(url).has('location')).toBe(false)
  })

  it('returns null without a usable date, so the caller renders no button', () => {
    expect(googleCalendarUrl({ title: 'x', eventDate: null })).toBeNull()
    expect(googleCalendarUrl({ title: 'x', eventDate: 'not a date' })).toBeNull()
  })
})

describe('isUpcomingEvent', () => {
  it('is true ahead of the date and false once it has passed', () => {
    const hour = 60 * 60 * 1000
    expect(isUpcomingEvent(new Date(Date.now() + hour).toISOString())).toBe(true)
    expect(isUpcomingEvent(new Date(Date.now() - hour).toISOString())).toBe(false)
  })

  it('is false for a missing or unparseable date', () => {
    expect(isUpcomingEvent(null)).toBe(false)
    expect(isUpcomingEvent('not a date')).toBe(false)
  })
})
