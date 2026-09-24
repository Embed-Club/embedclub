import type { BuildLinkBlock as BuildLinkBlockType } from '@/payload/payload-types'
import { SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'

interface BuildLinkBlockProps {
  block: BuildLinkBlockType
}

/**
 * A card that opens a board's editor on /build. Styled like the simulator card
 * so the two read as the same kind of "go and try it" moment in a tutorial.
 * All of its wording comes from the board document.
 */
export function BuildLinkBlock({ block }: BuildLinkBlockProps) {
  const target = block.buildTarget
  if (typeof target !== 'object' || target === null) return null

  return (
    <div className="my-16 w-full animate-in fade-in zoom-in duration-500 delay-400">
      <div className="rounded-2xl border border-border bg-card/40 px-6 py-8 text-center md:px-10 md:py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Program the {target.title} on Embed Club
            </h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {target.description}
            </p>
          </div>

          <Link
            href={`/build/${target.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <SquareArrowOutUpRight className="h-4 w-4" />
            Open the {target.title} editor
          </Link>
        </div>
      </div>
    </div>
  )
}
