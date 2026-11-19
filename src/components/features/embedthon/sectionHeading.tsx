import { cn } from '@/lib/utils'

/**
 * One heading pattern for every station on the EmbedThon page. The short copper
 * rule is the only ornament; section labels were removed on purpose, since a
 * tracked kicker above every section is the exact template tell this page had.
 */
export function SectionHeading({
  id,
  title,
  deck,
  className,
  titleClassName,
  deckClassName,
}: {
  id: string
  title: string
  deck?: string
  className?: string
  titleClassName?: string
  deckClassName?: string
}) {
  return (
    <header className={cn('mb-10 sm:mb-14', className)}>
      <h2
        id={id}
        className={cn(
          'max-w-[24ch] text-balance text-[clamp(1.9rem,4.2vw,3.1rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.025em] text-foreground',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {deck ? (
        <p
          className={cn(
            'mt-5 max-w-[58ch] text-[15px] leading-[1.7] text-foreground/70 sm:text-[17px]',
            deckClassName,
          )}
        >
          {deck}
        </p>
      ) : null}
    </header>
  )
}
