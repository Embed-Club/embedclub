import { Marquee } from '@/components/common/marquee'
import { TextReveal } from '@/components/common/textReveal'
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
 * Fourth section: three marquee rows of gallery photos, alternating scroll
 * direction. Hovering one row pauses only that row (per-row `pauseOnHover`).
 */
export function GalleryMarqueeSection({ images }: { images: string[] }) {
  if (images.length === 0) return null

  // Up to 15 images across 3 rows of 5. Rows fall back to the full set when
  // there aren't enough for a distinct slice, so every row always has content.
  const slice = (start: number, end: number) => {
    const part = images.slice(start, end)
    return part.length > 0 ? part : images
  }
  const rows = [
    { images: slice(0, 5), reverse: false },
    { images: slice(5, 10), reverse: true },
    { images: slice(10, 15), reverse: false },
  ]

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-center gap-8 overflow-hidden py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 md:px-12 lg:px-20">
        <div>
          <TextReveal
            as="h2"
            className="text-4xl md:text-5xl font-extrabold uppercase tracking-normal [-webkit-text-stroke:1.2px]"
          >
            From the Gallery
          </TextReveal>
          <p className="mt-2 text-muted-foreground font-semibold tracking-wide">
            Moments from workshops, builds, and events.
          </p>
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
        {rows.map((row, rowIndex) => (
          <Marquee
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3-row layout
            key={rowIndex}
            reverse={row.reverse}
            pauseOnHover
            className="[--duration:35s]"
          >
            {row.images.map((src, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: image URLs may repeat; index keeps them distinct
              <Tile key={`${rowIndex}-${i}`} src={src} />
            ))}
          </Marquee>
        ))}

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
      </div>
    </section>
  )
}
