import { Marquee } from '@/components/common/marquee'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

function Tile({ src }: { src: string }) {
  return (
    <div className="mx-2 h-40 w-64 shrink-0 overflow-hidden rounded-xl border border-border md:h-56 md:w-80">
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

/**
 * Fourth section: two marquee rows of gallery photos scrolling in opposite
 * directions. Hovering one row pauses only that row (per-row `pauseOnHover`).
 */
export function GalleryMarqueeSection({ images }: { images: string[] }) {
  if (images.length === 0) return null

  const row1 = images.slice(0, 5)
  // Fall back to row1 when there aren't enough images for a distinct second row.
  const row2 = images.length > 5 ? images.slice(5, 10) : row1

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-center gap-8 overflow-hidden py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 md:px-12 lg:px-20">
        <div>
          <h2 className="text-3xl font-bold md:text-5xl">From the Gallery</h2>
          <p className="mt-2 text-muted-foreground">Moments from workshops, builds, and events.</p>
        </div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See all photos
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative flex w-full flex-col gap-4">
        <Marquee pauseOnHover className="[--duration:35s]">
          {row1.map((src, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: image URLs may repeat; index keeps them distinct
            <Tile key={`r1-${i}`} src={src} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:35s]">
          {row2.map((src, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: image URLs may repeat; index keeps them distinct
            <Tile key={`r2-${i}`} src={src} />
          ))}
        </Marquee>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
      </div>
    </section>
  )
}
