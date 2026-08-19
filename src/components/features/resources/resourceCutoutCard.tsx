'use client'

import type { ResourceCardData } from '@/app/(frontend)/resources/resourcesPageContent'
import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardImage,
  CutoutCardInsetLabel,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import { ArrowUpRight, BarChart, Clock } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const NEW_BADGE_DAYS = 14

export function isNewResource(createdAt?: string) {
  if (!createdAt) return false
  const age = Date.now() - new Date(createdAt).getTime()
  return age >= 0 && age < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000
}

const BADGE_LABELS: Record<string, string> = {
  featured: 'Featured',
  popular: 'Popular',
  essential: 'Essential',
  comingSoon: 'Coming Soon',
}

/**
 * Badge that means "announced, not written yet". The card still renders - that
 * is the point of announcing it - but it does not link anywhere, because the
 * page behind it has nothing on it.
 */
const COMING_SOON = 'comingSoon'

interface ResourceCutoutCardProps {
  card: ResourceCardData
  /** Route prefix - `/resources` or `/tutorials`. */
  basePath?: string
}

export const ResourceCutoutCard = React.memo(
  ({ card, basePath = '/resources' }: ResourceCutoutCardProps) => {
    const badgeLabel = card.badge ? BADGE_LABELS[card.badge] : null
    const showNew = isNewResource(card.createdAt)
    const comingSoon = card.badge === COMING_SOON

    // A plain div rather than a disabled link: an anchor with no href is not
    // focusable and reads as a generic element to a screen reader anyway, so
    // there is nothing to gain from keeping the tag.
    const surfaceClassName = cn(
      cutoutCardSurfaceClassName,
      'flex h-full flex-col',
      comingSoon
        ? 'cursor-default'
        : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    )

    const body = (
      <>
        <CutoutCardMedia className="h-44 shrink-0 bg-muted">
          <CutoutCardImage
            alt={card.title}
            src={card.image}
            sizes="(max-width: 768px) 100vw, 20rem"
            className="object-contain"
          />
          <CutoutCardOverlay />

          {badgeLabel && (
            <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[16px] bg-card px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                {badgeLabel}
              </span>
              <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
              <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
            </CutoutCardInsetLabel>
          )}

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

        <CutoutCardContent className="flex flex-1 flex-col gap-2 p-4">
          <h3
            className={cn(
              'font-semibold leading-snug transition-colors line-clamp-2',
              !comingSoon && 'group-hover/cutout:text-primary',
            )}
          >
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
              {card.readTime ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {card.readTime} min
                </span>
              ) : null}
            </div>
            {/* The arrow is a navigation affordance, so it goes away on a card
                that does not navigate. */}
            {!comingSoon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </CutoutCardContent>
      </>
    )

    return (
      <CutoutCard className="h-full">
        {comingSoon ? (
          <div className={surfaceClassName}>{body}</div>
        ) : (
          <Link
            href={`${basePath}/${card.slug}`}
            aria-label={`Open: ${card.title}`}
            className={surfaceClassName}
          >
            {body}
          </Link>
        )}
      </CutoutCard>
    )
  },
)

ResourceCutoutCard.displayName = 'ResourceCutoutCard'
