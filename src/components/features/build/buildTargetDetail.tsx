import RichTextRender from '@/components/common/richTextRender'
import { BuildEditor } from '@/components/features/build/buildEditor'
import type { BuildTarget } from '@/payload/payload-types'
import { BarChart, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * A board's page on Build: the same hero as a resource (back link, tags,
 * title, description, difficulty), any setup notes, then the editor.
 *
 * The hero is deliberately the full-height one every other detail page uses.
 * It was briefly compacted to pull the editor above the fold, which traded the
 * site's signature for a generic tool header - the wrong trade, and exactly the
 * "modernizing" of a signature element AGENTS.md rules out. Detail pages here
 * open on the title and scroll to their content; this one is no exception.
 */
export function BuildTargetDetail({ target }: { target: BuildTarget }) {
  return (
    <div className="w-full min-h-screen text-foreground pb-24">
      <div className="relative w-full py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl">
          <Link
            href="/build"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-10"
          >
            <div className="p-1 rounded-full bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            Back to build
          </Link>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {target.tags?.map((tag) => {
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

            <h1 className="text-4xl md:text-6xl [-webkit-text-stroke:1px] font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]">
              {target.title}
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              {target.description}
            </p>

            {target.difficulty && (
              <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
                <BarChart className="h-4 w-4" />
                <span className="capitalize">{target.difficulty} difficulty</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl flex flex-col gap-10">
        {target.notes && (
          <section className="rounded-2xl border border-border bg-card/60 p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-4">Before you start</h2>
            <RichTextRender content={target.notes} />
          </section>
        )}

        <BuildEditor target={target} />
      </div>
    </div>
  )
}
