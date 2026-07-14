import { EmptyState } from '@/components/common/emptyState'
import { EventCard } from '@/components/features/events/eventsCards'
import type { Event } from '@/payload/payload-types'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

/** Second section: the latest 3 events + a "Show all" link to /events. */
export function LatestEventsSection({ events }: { events: Event[] }) {
  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-center gap-10 px-6 py-20 md:px-12 lg:px-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold md:text-5xl">Latest Events</h2>
          <p className="mt-2 text-muted-foreground">What the club has been up to lately.</p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Show all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No Events Yet" />
      ) : (
        <div className="flex flex-wrap justify-center gap-6 lg:justify-start">
          {events.map((event, index) => (
            <EventCard key={event.id ?? index} event={event} index={index} />
          ))}
        </div>
      )}
    </section>
  )
}
