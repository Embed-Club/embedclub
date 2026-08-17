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
 * (About, the legal pages) arrive in whatever case an officer typed.
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'absolute left-5 top-5 md:left-20 md:top-12 text-2xl md:text-4xl font-bold uppercase',
        className,
      )}
    >
      {children}
    </h1>
  )
}
