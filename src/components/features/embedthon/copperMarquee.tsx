import { Marquee } from '@/components/common/marquee'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const ITEMS = [
  "Embers '26",
  'National Level Technical Fest',
  'Project Expo',
  'Paper Presentation',
  'Ideas / Build / Innovate',
  '25 November 2026',
  'PACE Campus Mangaluru',
  'Embed / Explore / Evolve',
]

interface CopperMarqueeProps {
  className?: string
}

/**
 * Full-bleed fact ribbon. Alternating items are outlined rather than filled, so
 * the band reads as a poster strip instead of a row of chips. Decorative: every
 * fact is stated properly in the page copy.
 */
export const CopperMarquee = forwardRef<HTMLDivElement, CopperMarqueeProps>(function CopperMarquee(
  { className },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'relative w-full select-none overflow-hidden bg-background py-4 transition-colors duration-500',
        className,
      )}
    >
      <Marquee className="p-0 [--duration:36s] [&>div]:motion-reduce:[animation-play-state:paused]">
        {ITEMS.map((item, index) => (
          <span
            key={item}
            className="flex shrink-0 items-center gap-10 px-5 text-[clamp(1.35rem,2.8vw,2.4rem)] font-extrabold uppercase leading-none tracking-[-0.02em]"
          >
            <span
              className={
                index % 2 === 1 ? 'text-transparent' : 'text-primary transition-colors duration-500'
              }
              style={
                index % 2 === 1 ? { WebkitTextStroke: '1px hsl(var(--primary) / 0.75)' } : undefined
              }
            >
              {item}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 bg-primary transition-colors duration-500" />
          </span>
        ))}
      </Marquee>
    </div>
  )
})
