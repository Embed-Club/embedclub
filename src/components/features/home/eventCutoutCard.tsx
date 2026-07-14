'use client'

import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardImage,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { EventModal, eventToCard } from '@/components/features/events/eventsCards'
import { isNewEvent } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import type { Event } from '@/payload/payload-types'
import { useEffect, useRef, useState } from 'react'

/** Cutout-styled event card for the home page. Click opens the shared event modal. */
export function EventCutoutCard({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const card = eventToCard(event)
  const showNew = isNewEvent(event.eventDate)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <EventModal
        open={open}
        onClose={() => setOpen(false)}
        card={card}
        event={event}
        containerRef={containerRef}
      />

      <CutoutCard className="h-full">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View: ${card.title}`}
          className={cn(
            cutoutCardSurfaceClassName,
            'flex h-full w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <CutoutCardMedia className="aspect-[3/4] w-full shrink-0">
            <CutoutCardImage
              alt={card.title}
              src={card.src}
              sizes="(max-width: 768px) 50vw, 18rem"
            />
            <CutoutCardOverlay />

            {showNew && (
              <CutoutCardPin className="top-0 right-0 rounded-bl-[16px] bg-primary px-3 py-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                  New
                </span>
                <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-primary" />
                <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-primary" />
              </CutoutCardPin>
            )}
          </CutoutCardMedia>

          <CutoutCardContent className="flex flex-1 flex-col gap-1 p-4">
            <span className="text-xs font-medium text-primary">
              {card.category}
              {event.eventMode === 'online' && ' · Online'}
            </span>
            <h3 className="font-semibold leading-snug line-clamp-2 group-hover/cutout:text-primary transition-colors">
              {card.title}
            </h3>
          </CutoutCardContent>
        </button>
      </CutoutCard>
    </>
  )
}
