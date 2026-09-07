/**
 * Anonymous click counting for the actions Vercel Web Analytics cannot see.
 *
 * Vercel gives page views for free but gates custom events behind the Pro
 * plan, so anything that is not a navigation - launching an external
 * simulator, copying a code block, tapping an email address - is counted here
 * instead, into the club's own database. See `collections/trackedEvents`.
 *
 * Nothing identifying is sent: no id, no session, no referrer, no user agent.
 * The server does not record the IP either. A row says an action happened on a
 * path at a time, and nothing more.
 */

/**
 * Every event the site may send. The route rejects anything not on this list,
 * so a typo shows up as a dropped event rather than a new phantom event name,
 * and a stranger with the endpoint cannot invent categories.
 *
 * Keep this small. Each entry is a question someone actually wants answered;
 * page views already answer "did anyone visit this page?".
 */
export const TRACKED_EVENTS = [
  /** An external simulator was opened or downloaded. */
  'simulator_launch',
  /** A code block's copy button was used. */
  'code_copy',
  /** An email address or phone number on the contact page was tapped. */
  'contact_click',
  /** The legacy website link on the About page was followed. */
  'legacy_site_visit',
] as const

export type TrackedEventName = (typeof TRACKED_EVENTS)[number]

/** Longest `detail` the route will store, matching the column's own limit. */
export const TRACK_DETAIL_MAX_LENGTH = 120

/**
 * Record one action. Fire-and-forget: never awaited, never throws, and never
 * blocks the interaction it is attached to.
 *
 * `sendBeacon` is used where available so the request survives the page
 * navigating away - which is exactly what happens on a simulator launch. The
 * `fetch` fallback uses `keepalive` for the same reason.
 *
 * Honours Do Not Track. The counts are for the club's own curiosity; they are
 * not worth overriding someone's stated preference.
 */
export function trackEvent(name: TrackedEventName, detail?: string): void {
  if (typeof window === 'undefined') return

  const dnt =
    navigator.doNotTrack ??
    (window as unknown as { doNotTrack?: string }).doNotTrack ??
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack
  if (dnt === '1' || dnt === 'yes') return

  const body = JSON.stringify({
    name,
    detail: detail?.slice(0, TRACK_DETAIL_MAX_LENGTH),
    path: window.location.pathname,
  })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      return
    }

    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // A failed count is not worth surfacing to the visitor.
  }
}
