import RichTextRender from '@/components/common/richTextRender'
import { BuildEditor } from '@/components/features/build/buildEditor'
import type { BuildTarget } from '@/payload/payload-types'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * A board's page: a workbench, not an article.
 *
 * This used to open like a resource - a full-height title, the description at
 * reading size, then a wall of setup notes - which put the editor below the
 * fold on a 900px desktop and three screens down on a phone. The tool someone
 * came for was the one thing they could not see.
 *
 * So the header is one compact band, the notes collapse behind a summary, and
 * the editor takes every pixel left in the panel. The shell's scroll container
 * has a definite height, so `flex-1` here resolves against one viewport and
 * the footer still flows underneath.
 */
export function BuildTargetDetail({ target }: { target: BuildTarget }) {
  const tags = (target.tags ?? [])
    .map((tag) => (typeof tag === 'object' && tag !== null ? tag : null))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))

  return (
    <div className="flex min-h-full w-full flex-col gap-3 px-4 pb-10 pt-20 md:px-6 lg:pt-6">
      <header className="flex shrink-0 flex-col gap-2">
        <Link
          href="/build"
          className="group inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to build
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {target.title}
          </h1>
          {target.difficulty && (
            <span className="text-sm capitalize text-muted-foreground">{target.difficulty}</span>
          )}
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag.name}
            </span>
          ))}
        </div>

        <p className="line-clamp-2 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          {target.description}
        </p>

        {target.notes && (
          // A disclosure rather than a wall: the one instruction that matters
          // before you press anything is already in the editor's status line,
          // and this is what you open when that is not enough.
          <details className="group rounded-xl border border-border bg-card/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              Before you start
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:-rotate-90" />
            </summary>
            <div className="border-t border-border px-4 py-3 text-sm [&_p]:max-w-[70ch] [&_p]:text-sm [&_p]:leading-relaxed">
              <RichTextRender content={target.notes} />
            </div>
          </details>
        )}
      </header>

      {/* min-h-0 so the editor can actually shrink inside the flex column
          instead of pushing the page taller than the panel. */}
      <div className="flex min-h-0 flex-1 flex-col">
        <BuildEditor target={target} />
      </div>
    </div>
  )
}
