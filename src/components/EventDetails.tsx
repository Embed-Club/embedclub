'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Event } from '@/payload-types'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/admin/LeafletMap'), {
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
  const hasDescription = event.description && typeof event.description === 'object'
  const hasLocation = event.location?.address || event.location?.coords
  const hasContact = event.contact?.email || event.contact?.phone
  const hasVenue = event.venue?.roomName || event.venue?.floor

  return (
    <div className="space-y-6">
      {/* Quick Info Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Venue Information */}
        {hasVenue && (
          <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Venue
            </p>
            <div className="mt-2 space-y-1 text-sm text-neutral-900 dark:text-white">
              {event.venue?.roomName && <p>{event.venue.roomName}</p>}
              {event.venue?.floor && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  {event.venue.floor}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Location Information */}
        {event.location?.address && (
          <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Location
            </p>
            <p className="mt-2 text-sm text-neutral-900 dark:text-white">
              {event.location.address}
            </p>
          </div>
        )}
      </div>

      {/* Description Section */}
      {hasDescription && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            About Event
          </h3>
          <div className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
            {Array.isArray(event.description) ? (
              <div className="space-y-2">
                {event.description.map((block: any, idx: number) => (
                  <p key={idx}>{block.children?.[0]?.text || ''}</p>
                ))}
              </div>
            ) : (
              <p>{event.shortDescription || 'No description available'}</p>
            )}
          </div>
        </div>
      )}

      {/* Map Section */}
      {event.location?.coords?.lat && event.location?.coords?.lng && (
        <div className="space-y-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Map
            </p>

            <a
              href={`https://www.google.com/maps?q=${event.location.coords.lat},${event.location.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2 py-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-xs font-semibold "
            >
              Open in Google Maps
            </a>
          </div>

          <Suspense fallback={<Skeleton className="h-[240px] w-full rounded-lg" />}>
            <div className="relative h-[240px] w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
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
        <div className="space-y-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Contact
          </p>
          <div className="space-y-2 text-sm">
            {event.contact?.email && (
              <a
                href={`mailto:${event.contact.email}`}
                className="block text-blue-600 hover:underline dark:text-blue-400"
              >
                {event.contact.email}
              </a>
            )}
            {event.contact?.phone && (
              <a
                href={`tel:${event.contact.phone}`}
                className="block text-blue-600 hover:underline dark:text-blue-400"
              >
                {event.contact.phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasDescription && !hasLocation && !hasContact && !hasVenue && (
        <div className="rounded-lg bg-neutral-50 p-8 text-center dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No additional details available for this event.
          </p>
        </div>
      )}
    </div>
  )
}
