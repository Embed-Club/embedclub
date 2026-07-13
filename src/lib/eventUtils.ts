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
