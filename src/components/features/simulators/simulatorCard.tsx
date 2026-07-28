'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
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
        <CutoutCardMedia className="h-44 shrink-0">
          <CutoutCardImage
            alt={card.title}
            src={card.image}
            sizes="(max-width: 768px) 100vw, 20rem"
          />
          <CutoutCardOverlay />

          {/* Play affordance — the card launches a tool, not an article */}
          <CutoutCardPin className="top-0 right-0 rounded-bl-[16px] bg-primary px-3 py-2">
            <Play className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
            <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-primary" />
            <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-primary" />
          </CutoutCardPin>
        </CutoutCardMedia>

        <CutoutCardContent className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold leading-snug transition-colors line-clamp-2 group-hover/cutout:text-primary">
            {card.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
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
              <Play className="h-3 w-3" />
            </span>
          </div>
        </CutoutCardContent>
      </button>
    </CutoutCard>
  )
})

SimulatorCard.displayName = 'SimulatorCard'
