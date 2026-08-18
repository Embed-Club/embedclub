const NEW_WINDOW_PAST_DAYS = 60

/**
 * An event is NEW when it happened within the last 60 days (~2 months) or is
 * upcoming (any future date).
 */
export function isNewEvent(eventDate?: string | null): boolean {
  if (!eventDate) return false
  const t = new Date(eventDate).getTime()
  if (Number.isNaN(t)) return false
  return t >= Date.now() - NEW_WINDOW_PAST_DAYS * 24 * 60 * 60 * 1000
}

export function formatEventDate(eventDate?: string | null): string | null {
  if (!eventDate) return null
  const d = new Date(eventDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Whether the event is still ahead of us. */
export function isUpcomingEvent(eventDate?: string | null): boolean {
  if (!eventDate) return false
  const t = new Date(eventDate).getTime()
  if (Number.isNaN(t)) return false
  return t > Date.now()
}

/**
 * `YYYYMMDD` from the date's *local* parts.
 *
 * Deliberately not `toISOString().slice(...)`, which converts to UTC first: an
 * evening event in IST is the previous day in UTC, so the reminder would land
 * on the wrong date. Reading the local parts keeps it on the day
 * `formatEventDate` prints beside it.
 */
function toAllDayStamp(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${month}${day}`
}

interface CalendarEvent {
  title: string
  eventDate?: string | null
  /** Shown in the calendar entry's description. */
  details?: string | null
  location?: string | null
}

/**
 * A Google Calendar "add event" link for an event.
 *
 * All-day rather than timed: the CMS records a start time but nothing about how
 * long an event runs, and inventing a duration would put a wrong end time in
 * someone's calendar. This is a save-the-date reminder, so the day is the part
 * that matters.
 *
 * Google's all-day range treats the end as exclusive, hence the day after.
 *
 * Returns null when there is no usable date — the caller renders nothing rather
 * than a link to an empty calendar form.
 */
export function googleCalendarUrl({
  title,
  eventDate,
  details,
  location,
}: CalendarEvent): string | null {
  if (!eventDate) return null
  const start = new Date(eventDate)
  if (Number.isNaN(start.getTime())) return null

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toAllDayStamp(start)}/${toAllDayStamp(end)}`,
  })
  if (details) params.set('details', details)
  if (location) params.set('location', location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
