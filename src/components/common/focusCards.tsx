'use client'

import {
  CutoutCardInsetLabel,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { EventModal, eventToCard } from '@/components/features/events/eventsCards'
import { isNewEvent } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import type { Event } from '@/payload/payload-types'
import React, { useMemo, useState } from 'react'

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onClick,
  }: {
    card: Card
    index: number
    hovered: number | null
    setHovered: React.Dispatch<React.SetStateAction<number | null>>
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  }) => {
    const showNew = isNewEvent(card.event?.eventDate)
    const isOnline = card.event?.eventMode === 'online'

    return (
      <button
        type="button"
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
        className={cn(
          'group/cutout cursor-pointer rounded-2xl relative bg-card overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out p-0 outline-none',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        <img
          src={card.src}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className={cn(
            'absolute inset-0 bg-black/0 md:bg-black/40 transition-opacity duration-300 opacity-100 md:opacity-0',
            hovered === index ? 'md:opacity-100' : 'md:opacity-0',
          )}
        />

        {/* Cutout inset title strip */}
        <CutoutCardInsetLabel className="bottom-0 left-0 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-2.5 text-left">
          <span className="block truncate text-sm font-semibold text-foreground">{card.title}</span>
          {isOnline && (
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-primary">
              Online Event
            </span>
          )}
          <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
          <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
        </CutoutCardInsetLabel>

        {showNew && (
          <CutoutCardPin className="top-0 right-0 rounded-bl-[16px] bg-primary px-3 py-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
              New
            </span>
            <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-primary" />
            <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-primary" />
          </CutoutCardPin>
        )}
      </button>
    )
  },
)

Card.displayName = 'Card'

type Card = {
  title: string
  src: string
  event?: Event
}

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // The clicked card's box, so the panel can grow out of exactly that card.
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  const activeEvent = activeIndex === null ? undefined : cards[activeIndex]?.event

  const activeCard = useMemo(() => {
    if (activeIndex === null) return null
    const card = cards[activeIndex]
    if (!card) return null
    if (card.event) {
      return eventToCard(card.event)
    }
    return {
      src: card.src,
      title: card.title,
      category: 'Event',
      content: null,
    }
  }, [activeIndex, cards])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full md:px-8">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          onClick={(e) => {
            setOriginRect(e.currentTarget.getBoundingClientRect())
            setActiveIndex(index)
          }}
        />
      ))}
      {activeCard && (
        <EventModal
          open={activeIndex !== null}
          onClose={() => {
            setActiveIndex(null)
            setOriginRect(null)
          }}
          card={activeCard}
          event={activeEvent}
          originRect={originRect}
        />
      )}
    </div>
  )
}
