'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardImage,
  CutoutCardInsetLabel,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import { BarChart, Clock, Play } from 'lucide-react'
import React from 'react'

interface SimulatorCardProps {
  card: SimulatorCardData
  onOpen: (card: SimulatorCardData) => void
}

/**
 * Same cutout shell as the events, members, and resources cards — the design
 * language is one system, not per-page. Clicking opens the simulator modal
 * rather than navigating, so students see the walkthrough first.
 */
export const SimulatorCard = React.memo(({ card, onOpen }: SimulatorCardProps) => {
  return (
    <CutoutCard className="h-full">
      <button
        type="button"
        onClick={() => onOpen(card)}
        aria-label={`Open simulator: ${card.title}`}
        className={cn(
          cutoutCardSurfaceClassName,
          'flex h-full w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <CutoutCardMedia className="h-44 shrink-0 bg-muted">
          <CutoutCardImage
            alt={card.title}
            src={card.image}
            sizes="(max-width: 768px) 100vw, 20rem"
            className="object-contain"
          />
          <CutoutCardOverlay />

          {/* Name lives on the media, same cutout inset used for the modal's
              header — one label, not a repeated title in the content below. */}
          <CutoutCardInsetLabel className="bottom-0 left-0 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-2">
            <span className="font-semibold leading-snug line-clamp-1 text-card-foreground">
              {card.title}
            </span>
            <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
            <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
          </CutoutCardInsetLabel>
        </CutoutCardMedia>

        <CutoutCardContent className="flex flex-1 flex-col gap-2 p-4">
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {card.difficulty && (
                <span className="flex items-center gap-1 capitalize">
                  <BarChart className="h-3.5 w-3.5" />
                  {card.difficulty}
                </span>
              )}
              {card.estimatedTime ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {card.estimatedTime} min
                </span>
              ) : null}
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
              <Play className="h-3 w-3 fill-current" />
            </span>
          </div>
        </CutoutCardContent>
      </button>
    </CutoutCard>
  )
})

SimulatorCard.displayName = 'SimulatorCard'
