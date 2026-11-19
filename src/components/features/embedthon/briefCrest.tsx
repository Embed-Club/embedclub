'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from 'next-themes'
import { useRef } from 'react'

/** Narrowest the dome may get, as a fraction of the page width. */
const MIN_SIGMA = 0.32
const MAX_SIGMA = 0.6
const POINTS = 48
/** Progress at which the brief owns the viewport and the document goes light. */
const LIGHT_AT = 0.8

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

/**
 * The top edge of the brief: a soft dome that is full height as it enters and
 * relaxes to a straight edge as it arrives. `amplitude` is 1 for the full dome,
 * 0 for flat. Points are percentages of the crest box, so the shape scales with
 * the box and the bottom edge always lands on the section it belongs to.
 */
function crestPolygon(amplitude: number, sigma = MIN_SIGMA): string {
  // What the bell curve is worth at the page edge, so the tails land on zero.
  const tail = Math.exp(-((0.5 / sigma) ** 2))
  const points: string[] = []
  for (let i = 0; i <= POINTS; i++) {
    const t = i / POINTS
    const z = (t - 0.5) / sigma
    const bell = Math.max(0, (Math.exp(-z * z) - tail) / (1 - tail))
    points.push(`${(t * 100).toFixed(2)}% ${(100 - 100 * amplitude * bell).toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')}, 100% 101%, 0% 101%)`
}

/**
 * The hand-off from the hero to the brief.
 *
 * The hero stays put (it is sticky) and the brief rises over it, so the cover is
 * made by ordinary scrolling rather than by a second, fixed sheet that had to be
 * kept in step with it. This crest is the brief's own top edge: it carries the
 * same cream fill and the same grid, so there is no seam to blend. It is scrubbed
 * across the whole rise, relaxing from a full dome to a flat edge by the time the
 * brief is at the top, while the hero dims beneath it.
 *
 * Lives inside the brief's section: `closest('section')` is the trigger, and the
 * section's top margin is exactly the crest's height, so the dome starts below
 * the first screen and the opening view of the hero stays clean.
 */
export function BriefCrest({ cell }: { cell: { width: number; height: number } }) {
  const crestRef = useRef<HTMLDivElement>(null)
  const { setTheme } = useTheme()

  useGSAP(
    () => {
      const crest = crestRef.current
      const section = crest?.closest('section')
      if (!crest || !section) return

      gsap.registerPlugin(ScrollTrigger)
      const hero = document.getElementById('embedthon-hero')
      let wanted: 'light' | 'dark' | null = null
      let sigma = MIN_SIGMA

      /*
       * Keep the dome's slope the same on every screen: its width follows its
       * height rather than the page. A phone is narrow and the crest is tall for
       * it, so a fixed fraction of the width would make a spike instead of a mound.
       */
      const measure = () => {
        const { offsetWidth: width, offsetHeight: height } = crest
        if (!width) return
        sigma = Math.min(MAX_SIGMA, Math.max(MIN_SIGMA, (1.4 * height) / width))
      }

      const paint = (progress: number) => {
        crest.style.clipPath = crestPolygon(1 - smoothstep(0.18, 0.92, progress), sigma)
        if (hero) {
          hero.style.opacity = String(1 - 0.55 * progress)
          // Fully covered: stop painting it at all.
          hero.style.visibility = progress >= 1 ? 'hidden' : 'visible'
        }
      }

      const setPalette = (progress: number) => {
        const next = progress >= LIGHT_AT ? 'light' : 'dark'
        if (next === wanted) return
        wanted = next
        setTheme(next)
      }

      /*
       * Settle the palette from where the page actually is, not from the last
       * scroll event. A reload lands wherever the browser restored the scroll
       * with no scroll event, and a fast jump back up fires the schedule's
       * `onLeaveBack` (which sets light) after this trigger has already asked for
       * dark - either way the hero ends up as white text on cream. Only above the
       * brief's arrival: further down, other sections own the theme.
       */
      const settle = (progress: number) => {
        if (progress >= 1) return
        wanted = null
        setPalette(progress)
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        // Start when the dome's apex reaches the bottom of the screen: the
        // section's top margin is the crest's height, so that is this far below.
        start: () => `top bottom+=${crest.offsetHeight}`,
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure()
          paint(self.progress)
          settle(self.progress)
        },
        onUpdate: (self) => {
          paint(self.progress)
          setPalette(self.progress)
        },
        onLeave: () => setPalette(1),
        onLeaveBack: () => setPalette(0),
      })

      const onScrollEnd = () => settle(trigger.progress)
      ScrollTrigger.addEventListener('scrollEnd', onScrollEnd)

      return () => ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd)
    },
    { scope: crestRef },
  )

  return (
    <div
      ref={crestRef}
      id="embedthon-brief-crest"
      aria-hidden="true"
      // One pixel of overlap with the section, so antialiasing cannot leave a seam.
      className="pointer-events-none absolute inset-x-0 bottom-[calc(100%-1px)] h-[var(--crest-h)] bg-background"
      style={{
        clipPath: crestPolygon(1),
        willChange: 'clip-path',
        // Bottom-aligned, so the grid lattice continues the section's own.
        backgroundImage:
          'linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)',
        backgroundSize: cell.width > 0 ? `${cell.width}px ${cell.height}px` : undefined,
        backgroundPosition: '0 100%',
      }}
    />
  )
}
