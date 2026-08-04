import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { TableOfContents } from '@/components/features/resources/tableOfContents'
import { collectHeadings } from '@/lib/richTextHeadings'
import type { Resource, Tutorial } from '@/payload/payload-types'
import { BarChart, Calendar, ChevronLeft, Clock } from 'lucide-react'
import Link from 'next/link'

interface LearningDetailProps {
  doc: Resource | Tutorial
  /** Where the back link goes, e.g. `/resources`. */
  basePath: string
  /** Label for the back link, e.g. `resources`. */
  backLabel: string
}

/**
 * Detail body shared by the Resources and Tutorials routes — the two
 * collections hold the same document shape.
 */
export function LearningDetail({ doc, basePath, backLabel }: LearningDetailProps) {
  // `updatedAt` is Payload's own save timestamp, so "last updated" is always
  // truthful without an editor remembering to set a date by hand.
  const formattedDate = new Date(doc.updatedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const headings = collectHeadings(doc.content)

  return (
    // No background of its own: ContentPanel already paints `bg-background`
    // plus the `.texture-panel` grain, and an opaque colour here would cover
    // both — which is what pinned this page to near-black in light mode and
    // hid the site texture.
    <div className="w-full min-h-screen text-foreground pb-24">
      {/* Hero Section */}
      <div className="relative w-full py-16 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl">
          <Link
            href={basePath}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-10"
          >
            <div className="p-1 rounded-full bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            Back to {backLabel}
          </Link>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {doc.tags?.map((tag) => {
                const tagObj = typeof tag === 'object' ? tag : null
                return tagObj ? (
                  <span
                    key={tagObj.id}
                    className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full"
                  >
                    {tagObj.name}
                  </span>
                ) : null
              })}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.1]">
              {doc.title}
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              {doc.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Last updated {formattedDate}</span>
              </div>

              {doc.estimatedReadTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{doc.estimatedReadTime} min read</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span className="capitalize">{doc.difficulty} difficulty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-6 mt-12">
        {/* `justify-between` plus a capped prose column pushes the contents
            panel out to the right edge instead of letting it sit immediately
            beside the text. */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 xl:gap-20">
          {/* `data-toc-scope` bounds the reading-progress calculation to the
              article, so the full-viewport footer below doesn't count. */}
          <div data-toc-scope className="flex-1 min-w-0 max-w-4xl">
            <BlockRenderer blocks={doc.content || []} />
          </div>

          {/* Table of contents — hidden entirely when the doc has no headings,
              rather than showing an empty shell. */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-60 xl:w-64 shrink-0 h-fit sticky top-24">
              <div className="p-5 rounded-2xl bg-card/60 border border-border backdrop-blur-sm">
                <h4 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                  On this page
                </h4>
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
