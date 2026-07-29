import { EmptyState } from '@/components/common/emptyState'
import { type FormCardData, FormCutoutCard } from '@/components/features/forms/formCutoutCard'

interface FormsListingProps {
  cards: FormCardData[]
  emptyTitle: string
}

/**
 * Shared grid for the Forms and Feedback pages — the two list the same thing,
 * filtered by `type`, so they render through one component rather than
 * drifting apart.
 */
export function FormsListing({ cards, emptyTitle }: FormsListingProps) {
  if (cards.length === 0) {
    return <EmptyState title={emptyTitle} />
  }

  // Open forms first; a closed one is nothing anyone needs to reach quickly.
  const ordered = [...cards].sort((a, b) => Number(a.closed) - Number(b.closed))

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {ordered.map((card) => (
        <FormCutoutCard key={card.id} card={card} />
      ))}
    </div>
  )
}
