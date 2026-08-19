interface EmptyStateProps {
  title?: string
  message?: string
}

/**
 * The one empty-state used across every page. Same structure and copy
 * everywhere; only the title varies per page ("No Events Yet", …).
 */
export function EmptyState({
  title = 'Nothing Here Yet',
  message = "There's nothing here yet - check back soon!",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-4">
      <p className="text-2xl font-bold text-foreground mb-2">{title}</p>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
