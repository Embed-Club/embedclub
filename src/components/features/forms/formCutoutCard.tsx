'use client'

import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardInsetLabel,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import type { Event, Form } from '@/payload/payload-types'
import { ArrowUpRight, CalendarDays, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export interface FormCardData {
  id: string
  title: string
  slug: string
  description?: string | null
  deadline?: string | null
  closed: boolean
  eventTitle?: string | null
}

/** Map a Payload form doc to card data, resolving open/closed consistently. */
export function formToCard(form: Form, now: number = Date.now()): FormCardData {
  const relatedEvent = form.relatedEvent as Event | number | null | undefined
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    description: form.description,
    deadline: form.deadline,
    closed: !form.active || (form.deadline ? new Date(form.deadline).getTime() < now : false),
    eventTitle:
      typeof relatedEvent === 'object' && relatedEvent !== null ? relatedEvent.title : null,
  }
}

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
 * has no image — a form has nothing to show — so the cutout notch carries the
 * open/closed state instead of a media strip.
 */
export const FormCutoutCard = React.memo(({ card }: { card: FormCardData }) => {
  const body = (
    <CutoutCardContent className="flex flex-1 flex-col gap-2 p-5 pt-8">
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

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {card.deadline ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {card.closed ? 'Closed' : 'Open until'} {formatDeadline(card.deadline)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {card.closed ? 'Closed' : 'Open'}
          </span>
        )}

        {!card.closed && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </CutoutCardContent>
  )

  const statusStrip = (
    <CutoutCardInsetLabel
      className={cn(
        'top-0 left-0 rounded-br-[16px] px-4 py-2',
        card.closed ? 'bg-muted' : 'bg-card',
      )}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest',
          card.closed ? 'text-muted-foreground' : 'text-primary',
        )}
      >
        {card.closed && <Lock className="h-3 w-3" />}
        {card.closed ? 'Closed' : 'Open'}
      </span>
      <CutoutCorner
        className={cn(
          'absolute -right-[27px] -top-px -rotate-90',
          card.closed ? 'text-muted' : 'text-card',
        )}
      />
      <CutoutCorner
        className={cn(
          'absolute -bottom-[27px] -left-px -rotate-90',
          card.closed ? 'text-muted' : 'text-card',
        )}
      />
    </CutoutCardInsetLabel>
  )

  if (card.closed) {
    return (
      <CutoutCard className="h-full">
        <div
          className={cn(
            cutoutCardSurfaceClassName,
            'flex h-full cursor-default flex-col opacity-70',
          )}
        >
          {statusStrip}
          {body}
        </div>
      </CutoutCard>
    )
  }

  return (
    <CutoutCard className="h-full">
      <Link
        href={`/forms/${card.slug}`}
        aria-label={`Open form: ${card.title}`}
        className={cn(
          cutoutCardSurfaceClassName,
          'flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {statusStrip}
        {body}
      </Link>
    </CutoutCard>
  )
})

FormCutoutCard.displayName = 'FormCutoutCard'
