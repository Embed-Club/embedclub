'use client'

import {
  CutoutCardInsetLabel,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { ImgWithSkeleton } from '@/components/common/imageWithSkeleton'
import { EventDetails } from '@/components/features/events/eventDetails'
import { isNewEvent } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import type { Event } from '@/payload/payload-types'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface EventDetailViewProps {
  event: Event
}

function getEventImageUrl(event: Event): string {
  return typeof event.image === 'object' && event.image !== null && 'url' in event.image
    ? event.image.url || '/placeholder/placeholder.webp'
    : '/placeholder/placeholder.webp'
}

export function EventDetailView({ event }: EventDetailViewProps) {
  const imageUrl = getEventImageUrl(event)
  const isOnline = event.eventMode === 'online'
  const isNew = isNewEvent(event.eventDate)

  return (
    <div className="w-full min-h-screen text-foreground pb-24 pt-16 md:pt-28">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Navigation */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-1 rounded-full bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            Back to events
          </Link>
        </div>

        {/* Main Grid: Poster Card + Details Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Poster Section with cutout aesthetics */}
          <div
            className={cn(
              'group/cutout relative w-full aspect-[4/5] md:aspect-auto md:min-h-[34rem] rounded-2xl bg-card overflow-hidden shadow-lg',
              cutoutCardSurfaceShadowClassName,
            )}
          >
            <ImgWithSkeleton
              src={imageUrl}
              alt={event.title || 'Event poster'}
              wrapperClassName="absolute inset-0"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

            {/* Inset Label with Category & Title */}
            <CutoutCardInsetLabel className="bottom-0 left-0 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-3 text-left z-20">
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-primary">
                {event.category || 'Event'}
                {isOnline && ' · Online'}
              </span>
              <span className="mt-1 block text-base md:text-xl font-semibold text-foreground [text-wrap:balance]">
                {event.title}
              </span>
              <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
              <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
            </CutoutCardInsetLabel>

            {/* New Badge */}
            {isNew && (
              <CutoutCardPin className="top-0 right-0 rounded-bl-[16px] bg-primary px-3 py-1.5 z-20">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                  New
                </span>
                <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-primary" />
                <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-primary" />
              </CutoutCardPin>
            )}
          </div>

          {/* Details Section */}
          <div className="rounded-2xl bg-card p-6 md:p-8 border border-border/40 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-4">
              {event.title}
            </h1>
            {event.shortDescription && (
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
                {event.shortDescription}
              </p>
            )}
            <EventDetails event={event} />
          </div>
        </div>
      </div>
    </div>
  )
}
