'use client'

import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardInsetLabel,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import type { FormCardData } from '@/components/features/forms/formCardData'
import { cn } from '@/lib/utils'
import { ArrowUpRight, CalendarDays, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Forms and Feedback list the same kind of thing, so they share one card. It
 * has no image - a form has nothing to show - so the cutout notch carries the
 * open/closed state instead of a media strip.
 */
export const FormCutoutCard = React.memo(({ card }: { card: FormCardData }) => {
  const body = (
    <CutoutCardContent className="flex flex-1 flex-col gap-2 p-5 pb-12 pt-8">
      {card.eventTitle && (
        <span className="text-xs font-medium text-muted-foreground">{card.eventTitle}</span>
      )}
      <h3
        className={cn(
          'font-semibold leading-snug line-clamp-2',
          !card.closed && 'transition-colors group-hover/cutout:text-primary',
        )}
      >
        {card.title}
      </h3>
      {card.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
      )}
    </CutoutCardContent>
  )

  const statusStrip = (
    <CutoutCardInsetLabel
      className={cn(
        'top-0 right-0 rounded-bl-[16px] px-4 py-2',
        card.closed ? 'bg-muted' : 'bg-primary',
      )}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest',
          // `text-foreground` for closed: `text-muted-foreground` on `bg-muted`
          // is muted-on-muted, too low-contrast to read at a glance.
          card.closed ? 'text-foreground/80' : 'text-primary-foreground',
        )}
      >
        {card.closed && <Lock className="h-3 w-3" />}
        {card.closed ? 'Closed' : 'Open'}
      </span>
      <CutoutCorner
        className={cn(
          'absolute -left-[27px] -top-px -rotate-90',
          card.closed ? 'text-muted' : 'text-primary',
        )}
      />
      <CutoutCorner
        className={cn(
          'absolute -bottom-[27px] -right-px -rotate-90',
          card.closed ? 'text-muted' : 'text-primary',
        )}
      />
    </CutoutCardInsetLabel>
  )

  const deadlineStrip = (
    <>
      <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[16px] bg-background px-5 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {card.deadline ? (
            <Clock className="h-3.5 w-3.5" />
          ) : (
            <CalendarDays className="h-3.5 w-3.5" />
          )}
          {card.deadline
            ? `${card.closed ? 'Closed' : 'Open until'} ${formatDeadline(card.deadline)}`
            : card.closed
              ? 'Closed'
              : 'Open'}
        </span>
        <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-background" />
        <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-background" />
      </CutoutCardInsetLabel>
      {!card.closed && (
        <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  )

  if (card.closed) {
    return (
      <CutoutCard className="h-full">
        <div
          className={cn(
            cutoutCardSurfaceClassName,
            // Not opacity-70: that washed out the body text along with the
            // strip, on top of it already being muted-on-muted. Closed reads
            // fine from the lock icon and strip alone.
            'flex h-full cursor-default flex-col',
          )}
        >
          {statusStrip}
          {body}
          {deadlineStrip}
        </div>
      </CutoutCard>
    )
  }

  return (
    <CutoutCard className="h-full">
      <Link
        href={card.href}
        aria-label={`Open form: ${card.title}`}
        className={cn(
          cutoutCardSurfaceClassName,
          'flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {statusStrip}
        {body}
        {deadlineStrip}
      </Link>
    </CutoutCard>
  )
})

FormCutoutCard.displayName = 'FormCutoutCard'
