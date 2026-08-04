import type { AccordionBlock as AccordionBlockType } from '@/payload/payload-types'
import { ChevronDown } from 'lucide-react'
import { BlockMapper } from '../blockMapper'

interface AccordionBlockProps {
  block: AccordionBlockType
  headingIds?: string[]
}

/**
 * Collapsible sections, for a page that is several self-contained parts rather
 * than one continuous read.
 *
 * Built on native `<details>` / `<summary>` rather than state and a click
 * handler. That gets keyboard support, the correct ARIA semantics, and
 * in-page search ("find on page" opens a closed section in current browsers)
 * for free — none of which a div-and-onClick version has unless it is written,
 * and it usually is not. It also means this stays a server component, so the
 * blocks inside it can be server components too.
 *
 * No `name` attribute on the details elements: that would make them exclusive,
 * and a reader comparing two sessions should be able to open both.
 */
export function AccordionBlock({ block, headingIds }: AccordionBlockProps) {
  const items = block.items ?? []
  if (items.length === 0) return null

  return (
    <section className="my-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {block.heading && (
        <h2 className="mb-5 text-2xl font-bold text-foreground">{block.heading}</h2>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <details
            key={item.id || index}
            open={item.defaultOpen ?? false}
            className="group overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm transition-colors open:border-primary/40"
          >
            {/* `list-none` plus the webkit pseudo-element rule kills the default
                triangle marker, which no browser lets you style. Padding is
                tighter on mobile: an accordion already eats into the content
                column with its own border and this padding, on top of the
                page's own side padding, so mobile keeps as much of that width
                as it can for what's actually inside (a code block, a
                screenshot) rather than for the accordion's own chrome. */}
            <summary className="flex cursor-pointer list-none items-start gap-3 sm:gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary transition-transform duration-300 group-open:rotate-180">
                <ChevronDown className="h-4 w-4" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </span>
                {item.summary && (
                  <span className="text-sm text-muted-foreground">{item.summary}</span>
                )}
              </span>
            </summary>

            <div className="border-t border-border px-4 sm:px-5 pb-4 sm:pb-5 pt-3 sm:pt-4">
              {(item.blocks ?? []).map((inner, innerIndex) => (
                <BlockMapper
                  key={inner.id || innerIndex}
                  // The nested list is a narrower union than BlockMapper's
                  // parameter (no rowBlock or accordionBlock inside a section),
                  // which is a subtype, so this is a widening cast.
                  block={inner as Parameters<typeof BlockMapper>[0]['block']}
                  index={innerIndex}
                  headingIds={headingIds}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
