import { TextReveal } from '@/components/common/textReveal'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageTitleProps {
  children: ReactNode
  /** Extra classes for the rare page that needs one (e.g. a stacking context). */
  className?: string
}

/**
 * The page title, pinned to the same corner on every page.
 *
 * This exists because the same eight classes were pasted into fourteen pages
 * and had already drifted three ways: most used `font-bold`, the newer text
 * pages used `font-medium uppercase`, and Members had lost its `absolute`
 * entirely (plus an `mb-30` that Tailwind never emitted), so its title sat in
 * the document flow instead of the corner.
 *
 * `uppercase` is on the shared class rather than left to the caller: most
 * titles are literal capitals in the JSX, but the ones fed from the CMS
 * (About, the legal pages) arrive in whatever case a member typed.
 *
 * The split reveal is the same one the home page section headings use, so
 * every page opens on the same motion. `TextReveal` keeps the full string in
 * `aria-label` and hides the split spans, so the title still reads as one
 * heading, and it falls back to a plain fade under `prefers-reduced-motion`.
 *
 * Single-word titles (RESOURCES, TUTORIALS, SIMULATORS) get a per-character
 * sweep instead of a per-word one - `TextReveal` picks that on its own. See the
 * note there: word-splitting leaves a one-word title with nothing to stagger.
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <TextReveal
      as="h1"
      className={cn(
        'absolute left-5 top-5 md:left-20 md:top-12 text-[28px] md:text-[42px] font-extrabold uppercase',
        className,
      )}
    >
      {children}
    </TextReveal>
  )
}
