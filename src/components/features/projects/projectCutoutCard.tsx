'use client'

import type { ProjectCardData } from '@/app/(frontend)/projects/projectsPageContent'
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
import { ArrowUpRight, Users } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  inProgress: 'In Progress',
  completed: 'Completed',
}

interface ProjectCutoutCardProps {
  card: ProjectCardData
}

/** Same cutout shell as events, members, resources, and simulators. */
export const ProjectCutoutCard = React.memo(({ card }: ProjectCutoutCardProps) => {
  const statusLabel = STATUS_LABELS[card.status] ?? null

  return (
    <CutoutCard className="h-full">
      <Link
        href={`/projects/${card.slug}`}
        aria-label={`Open project: ${card.title}`}
        className={cn(
          cutoutCardSurfaceClassName,
          'flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <CutoutCardMedia className="h-44 shrink-0">
          <CutoutCardImage
            alt={card.title}
            src={card.image}
            sizes="(max-width: 768px) 100vw, 20rem"
          />
          <CutoutCardOverlay />

          {statusLabel && (
            <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[16px] bg-card px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                {statusLabel}
              </span>
              <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
              <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
            </CutoutCardInsetLabel>
          )}
        </CutoutCardMedia>

        <CutoutCardContent className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold leading-snug transition-colors line-clamp-2 group-hover/cutout:text-primary">
            {card.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {card.teamCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {card.teamCount} {card.teamCount === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CutoutCardContent>
      </Link>
    </CutoutCard>
  )
})

ProjectCutoutCard.displayName = 'ProjectCutoutCard'
