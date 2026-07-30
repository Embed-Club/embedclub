'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { formatEventDate } from '@/lib/eventUtils'
import type { Event } from '@/payload/payload-types'
import { CalendarDays, Video } from 'lucide-react'
import dynamic from 'next/dynamic'
import type React from 'react'
import { Suspense } from 'react'

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/admin/leafletMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-lg" />,
})

interface EventDetailsProps {
  event: Event
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
                <p className="text-xs text-muted-foreground">
                  {event.venue.floor}
                </p>
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
            <p className="mt-2 text-sm text-foreground">
              {event.location.address}
            </p>
          </div>
        )}
      </div>

      {/* Description Section */}
      {hasDescription && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            About Event
          </h3>
          <div className="text-sm text-foreground/90 line-clamp-3">
            {Array.isArray(event.description) ? (
              <div className="space-y-2">
                {event.description.map((block: Record<string, unknown>, idx: number) => {
                  const arr = block.children as Array<{ text?: string }> | undefined
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: simple static render
                    <p key={idx}>{arr?.[0]?.text || ''}</p>
                  )
                })}
              </div>
            ) : (
              <p>{event.shortDescription || 'No description available'}</p>
            )}
          </div>
        </div>
      )}

      {/* Map Section */}
      {!isOnline && event.location?.coords?.lat && event.location?.coords?.lng && (
        <div className="space-y-2 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Map
            </p>

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
          <div className="space-y-2 text-sm">
            {event.contact?.email && (
              <a
                href={`mailto:${event.contact.email}`}
                className="block text-primary hover:underline"
              >
                {event.contact.email}
              </a>
            )}
            {event.contact?.phone && (
              <a
                href={`tel:${event.contact.phone}`}
                className="block text-primary hover:underline"
              >
                {event.contact.phone}
              </a>
            )}
          </div>
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
