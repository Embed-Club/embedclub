import { EmptyState } from '@/components/common/emptyState'
import type { FormCardData } from '@/components/features/forms/formCardData'
import { FormCutoutCard } from '@/components/features/forms/formCutoutCard'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface FormsListingProps {
  cards: FormCardData[]
  emptyTitle: string
  /** Two columns instead of three - the section picker inside a form. */
  compact?: boolean
}

function closedOn(deadline?: string | null): string | null {
  if (!deadline) return null
  return new Date(deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Shared by the Forms and Feedback pages (and a form's section picker).
 *
 * Open forms get the cards; closed ones go in a folded list underneath. The
 * archive imported from Google is thirty-odd forms back to 2020, and as cards
 * they buried the one form a visitor came for - the open one - in a wall of
 * CLOSED badges.
 */
export function FormsListing({ cards, emptyTitle, compact }: FormsListingProps) {
  if (cards.length === 0) return <EmptyState title={emptyTitle} />

  // A form's own sections are few and all belong on screen, closed or not -
  // folding them away would leave the page looking empty.
  if (compact) {
    const ordered = [...cards].sort((a, b) => Number(a.closed) - Number(b.closed))
    return (
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {ordered.map((card) => (
          <FormCutoutCard key={card.id} card={card} />
        ))}
      </div>
    )
  }

  const open = cards.filter((card) => !card.closed)
  const past = cards.filter((card) => card.closed)

  return (
    <div className="w-full space-y-10">
      {open.length > 0 ? (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {open.map((card) => (
            <FormCutoutCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing Open Right Now"
          message="No form is taking responses at the moment. Past ones are listed below."
        />
      )}

      {past.length > 0 && (
        <details
          className="group rounded-2xl border border-border bg-card/60"
          open={open.length === 0 && past.length <= 6}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">
              Past forms <span className="font-normal text-muted-foreground">({past.length})</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {past.map((card) => (
              <li key={card.id}>
                <Link
                  href={card.href}
                  className="flex flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{card.title}</span>
                    {card.eventTitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {card.eventTitle}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {closedOn(card.deadline) ? `Closed ${closedOn(card.deadline)}` : 'Closed'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
