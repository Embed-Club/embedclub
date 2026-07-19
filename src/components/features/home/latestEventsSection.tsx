import { EmptyState } from '@/components/common/emptyState'
import { EventCutoutCard } from '@/components/features/home/eventCutoutCard'
import { LogoMarquee } from '@/components/features/home/logoMarquee'
import type { Event } from '@/payload/payload-types'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

/** The events header + card grid, without a section wrapper — so it can render
 *  either as its own section or inside another (e.g. the mobile hero). */
export function LatestEventsContent({
  events,
  className,
}: { events: Event[]; className?: string }) {
  return (
    <div className={`flex flex-col gap-10 ${className ?? ''}`}>
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
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {events.map((event) => (
            <EventCutoutCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Second section: a logo marquee (desktop only — mobile shows it in the hero),
 *  then the latest events as cutout cards. */
export function LatestEventsSection({ events }: { events: Event[] }) {
  return (
    <section id="events" className="relative flex min-h-[100svh] w-full flex-col gap-12 pb-16">
      <LogoMarquee className="hidden lg:block" />
      <div className="flex flex-1 flex-col justify-center px-6 md:px-12 lg:px-20">
        <LatestEventsContent events={events} />
      </div>
    </section>
  )
}
