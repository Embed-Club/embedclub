'use client'

import type { RichTextHeading } from '@/lib/richTextHeadings'
import { useEffect, useState } from 'react'

/** Indent per heading level, spelled out for Tailwind's JIT scanner. */
const LEVEL_INDENT: Record<number, string> = {
  2: '',
  3: 'ps-3',
  4: 'ps-6',
  5: 'ps-9',
  6: 'ps-12',
}

/**
 * "On this page" nav for Resources/Tutorials detail pages.
 *
 * Anchor ids come from `lib/richTextHeadings`, which also feeds the renderer,
 * so the links and the headings can't drift apart.
 */
export function TableOfContents({ headings }: { headings: RichTextHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    if (headings.length === 0) return

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    // `root: null` is correct even though the page scrolls inside ContentPanel
    // rather than the window — IntersectionObserver compares against the
    // viewport, and the panel fills it. The top margin biases towards the
    // heading just under the fixed nav instead of whatever is centred.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="flex flex-col gap-1" aria-label="On this page">
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          aria-current={activeId === heading.id ? 'location' : undefined}
          className={`border-l-2 py-1 ps-3 text-sm transition-colors ${
            LEVEL_INDENT[heading.level] ?? ''
          } ${
            activeId === heading.id
              ? 'border-primary font-medium text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  )
}
