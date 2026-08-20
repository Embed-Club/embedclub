'use client'

import RichTextRender from '@/components/common/richTextRender'
import { ContactLinks } from '@/components/features/contact/contactLinks'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEventDate, googleCalendarUrl, isUpcomingEvent } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import type { Event } from '@/payload/payload-types'
import { CalendarDays, CalendarPlus, ChevronDown, Video } from 'lucide-react'
import dynamic from 'next/dynamic'
import type React from 'react'
import { Suspense, useEffect, useRef, useState } from 'react'

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/admin/leafletMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-lg" />,
})

interface EventDetailsProps {
  event: Event
}

/** Roughly three lines of body text - enough to judge whether to read on. */
const COLLAPSED_MAX_HEIGHT = '4.5rem'

/**
 * The event description, collapsed to its opening lines with a toggle.
 *
 * The full text is always in the DOM, clipped by max-height rather than
 * truncated: search engines and screen readers get the whole description, and
 * expanding costs no fetch.
 *
 * The toggle only appears when there is something hidden. That is measured
 * rather than guessed from character count, because what overflows depends on
 * the column width and the reader's font size - a description that needs a
 * toggle on a phone often doesn't on a desktop.
 */
function EventDescription({
  content,
  fallback,
}: {
  content?: Record<string, unknown> | null
  fallback?: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  // Drives the clip. Animating needs a concrete pixel target, but a resting
  // expanded element needs no cap at all, so this holds a measured height only
  // for the duration of the transition and then becomes 'none'.
  const [maxHeight, setMaxHeight] = useState<string>(COLLAPSED_MAX_HEIGHT)
  const clipRef = useRef<HTMLDivElement>(null)

  // Measure before each transition rather than trusting a fixed ceiling: a
  // description long enough to exceed the guess would otherwise stay clipped
  // with no scrollbar to reach the rest.
  const toggle = () => {
    const el = clipRef.current
    if (!el) return

    if (expanded) {
      // 'none' cannot be animated from, so pin the current height first and
      // let the browser paint it before collapsing.
      setMaxHeight(`${el.scrollHeight}px`)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMaxHeight(COLLAPSED_MAX_HEIGHT))
      })
    } else {
      setMaxHeight(`${el.scrollHeight}px`)
    }
    setExpanded((open) => !open)
  }

  useEffect(() => {
    // Only while collapsed: once expanded the element is its own full height,
    // so measuring then would always report no overflow and hide the toggle
    // the reader just used.
    if (expanded) return
    const el = clipRef.current
    if (!el) return

    // A couple of pixels of slack - sub-pixel line heights round scrollHeight
    // up past clientHeight on text that visually fits.
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 4)
    check()

    // Re-measure on resize: the modal is two columns on desktop and one on a
    // phone, so the same text wraps to a different number of lines.
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded])

  if (!content && !fallback) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        About Event
      </h3>

      <div className="relative">
        <div
          ref={clipRef}
          id="event-description"
          className="overflow-hidden text-sm text-foreground/90 transition-[max-height] duration-300 ease-out"
          style={{ maxHeight }}
          // Release the cap once the opening animation lands. Text that reflows
          // afterwards - a late font swap, a resize - then grows freely instead
          // of being clipped by a height measured a moment ago. Guarded against
          // transitions bubbling up from the rendered rich text.
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget && expanded) setMaxHeight('none')
          }}
        >
          {content ? <RichTextRender content={content} /> : <p>{fallback}</p>}
        </div>

        {/* Fades the clipped line instead of cutting it mid-stroke. Hidden once
            expanded, and pointer-events-none so it never eats a click. */}
        {!expanded && overflows && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls="event-description"
          className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-300', expanded && 'rotate-180')}
          />
        </button>
      )}
    </div>
  )
}

/**
 * EventDetails Component
 *
 * Displays comprehensive event information in the modal:
 * - Rich text description
 * - Location information (address, room, floor)
 * - Interactive map with coordinates
 * - Contact information (email, phone)
 * - Event dates and venue
 *
 * This separates event data presentation from card UI logic,
 * making it reusable across different pages and components.
 */
export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const isOnline = event.eventMode === 'online'
  const hasDescription = event.description && typeof event.description === 'object'
  const hasLocation = !isOnline && (event.location?.address || event.location?.coords)
  const hasContact = event.contact?.email || event.contact?.phone
  const hasVenue = !isOnline && (event.venue?.roomName || event.venue?.floor)
  const dateLabel = formatEventDate(event.eventDate)
  // Only for events still ahead: a reminder for something that already happened
  // is noise in someone's calendar.
  const calendarUrl = isUpcomingEvent(event.eventDate)
    ? googleCalendarUrl({
        title: event.title,
        eventDate: event.eventDate,
        details: event.shortDescription ?? undefined,
        // Online events have no address; the meeting link is the place to be.
        location: isOnline
          ? (event.meetingLink ?? undefined)
          : [event.venue?.roomName, event.location?.address].filter(Boolean).join(', ') ||
            undefined,
      })
    : null
  // Forms point at the event (Forms → Related Event), surfaced back here by a
  // join field. Take the first open registration form.
  const registrationSlug =
    event.forms?.docs
      ?.filter((f): f is Exclude<typeof f, number> => typeof f === 'object' && f !== null)
      .find(
        (f) =>
          f.type === 'registration' &&
          f.active !== false &&
          (!f.deadline || new Date(f.deadline).getTime() > Date.now()),
      )?.slug ?? null

  return (
    <div className="space-y-6">
      {/* Date + mode */}
      {(dateLabel || isOnline) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {dateLabel && (
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              {dateLabel}
            </span>
          )}
          {isOnline && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-primary">
              Online Event
            </span>
          )}
        </div>
      )}

      {/* Registration */}
      {registrationSlug && (
        <a
          href={`/forms/${registrationSlug}`}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
        >
          Register for this event
        </a>
      )}

      {/* Save the date - a Google Calendar template link, so it opens a
          pre-filled entry the visitor confirms themselves. Secondary styling:
          registering is the action that matters when both are present. */}
      {calendarUrl && (
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-primary/40 text-primary font-semibold rounded-xl hover:bg-primary/10 transition-all"
        >
          <CalendarPlus className="h-4 w-4" />
          Save the date
        </a>
      )}

      {/* Online meeting link */}
      {isOnline && event.meetingLink && (
        <a
          href={event.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-primary/40 text-primary font-semibold rounded-xl hover:bg-primary/10 transition-all"
        >
          <Video className="h-4 w-4" />
          Join online meeting
        </a>
      )}

      {/* Quick Info Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Venue Information */}
        {hasVenue && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Venue
            </p>
            <div className="mt-2 space-y-1 text-sm text-foreground">
              {event.venue?.roomName && <p>{event.venue.roomName}</p>}
              {event.venue?.floor && (
                <p className="text-xs text-muted-foreground">{event.venue.floor}</p>
              )}
            </div>
          </div>
        )}

        {/* Location Information */}
        {!isOnline && event.location?.address && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Location
            </p>
            <p className="mt-2 text-sm text-foreground">{event.location.address}</p>
          </div>
        )}
      </div>

      {/* Description Section - the whole thing, collapsed to its opening lines.
          This used to test `Array.isArray(description)`, but Payload's rich text
          is a `{ root: … }` object, so that branch never ran and every event
          showed its one-line shortDescription in place of the description. */}
      <EventDescription
        content={hasDescription ? event.description : null}
        fallback={event.shortDescription}
      />

      {/* Map Section */}
      {!isOnline && event.location?.coords?.lat && event.location?.coords?.lng && (
        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Map</p>

            <a
              href={`https://www.google.com/maps?q=${event.location.coords.lat},${event.location.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2 py-1 text-xs font-semibold transition hover:bg-accent"
            >
              Open in Google Maps
            </a>
          </div>

          <Suspense fallback={<Skeleton className="h-[240px] w-full rounded-lg" />}>
            <div className="relative h-[240px] w-full overflow-hidden rounded-lg border border-border">
              <LeafletMap
                lat={event.location.coords.lat}
                lng={event.location.coords.lng}
                zoom={event.location.zoom ?? 13}
                readonly
                onChange={() => {}}
              />
            </div>
          </Suspense>
        </div>
      )}

      {/* Contact Information */}
      {hasContact && (
        <div className="space-y-2 rounded-lg bg-muted p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contact
          </p>
          {/* Same cards as /contact, at modal scale: the email opens a mail
              client picker and the phone dials on a touch device instead of
              being a bare mailto or tel link that does nothing on desktop. */}
          <ContactLinks email={event.contact?.email} phone={event.contact?.phone} size="compact" />
        </div>
      )}

      {/* Empty State */}
      {!hasDescription && !hasLocation && !hasContact && !hasVenue && (
        <div className="rounded-lg bg-muted p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No additional details available for this event.
          </p>
        </div>
      )}
    </div>
  )
}
