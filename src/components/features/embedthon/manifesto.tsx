'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'
import { BriefCrest } from './briefCrest'
import { useEmbedthonReveal } from './embedthonRevealContext'
import type { EventType } from './eventType'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

/**
 * Safety margin for the auto-fit, so the last glyph of a word never loses a
 * pixel to subpixel rounding at the column edge.
 */
const FIT_MARGIN = 0.98

/**
 * The brief: one giant caption on the left, the rest of it cut into the short
 * words the right column stacks, so each one fills its row the way the
 * reference's words do.
 */
const BRIEF: Record<
  EventType,
  {
    caption: string
    words: string[]
  }
> = {
  embers: {
    caption: 'IDEAS',
    words: [
      'BECOME',
      'THINGS',
      'HERE.',
      'BRING A',
      'PROJECT.',
      'SHARE A',
      'PAPER.',
      'MEET PEOPLE',
      'WHO BUILD.',
      'LEARN.',
      'COMPETE.',
      'LEAVE WITH',
      'SOMETHING',
      'NEW.',
    ],
  },
  embedthon: {
    caption: 'LEARN',
    words: [
      'THE AGENT',
      'WORKFLOW.',
      'BUILD WITH',
      'YOUR TEAM.',
      'TURN A',
      'PROMPT INTO',
      'SOFTWARE',
      'THAT WORKS.',
    ],
  },
}

/**
 * The page's scroll-scrubbed brief, built 1:1 identical to Santalarch's approach section (#approach).
 *
 * Left column (.title-wrap):
 *   Sticky container pinned at the vertical center of the viewport (top: calc(50svh - 4rem)).
 *   Holds the giant caption (IDEAS / LEARN) in monumental typography.
 *
 * Right column (.approach-wrap):
 *   .words-wrap with overflow: hidden.
 *   Each word sits in normal document flow, initially at translateX(100%).
 *   Scrubbed to translateX(0) with stagger via GSAP ScrollTrigger.
 *   As the user scrolls, natural vertical document scroll moves the section UP while GSAP scrubs
 *   the word from right to left, causing each word to enter diagonally from the bottom-right corner,
 *   align in the middle next to the caption, and then scroll up and exit hidden off the top.
 *
 * Mobile fallback (< 1024px):
 *   Words are centered with transform: none and opacity: 0.05.
 *   As each word crosses the viewport center, it toggles to opacity: 1.
 */
export function Manifesto({ event }: { event: EventType }) {
  const root = useRef<HTMLElement>(null)
  const items = useRef<(HTMLSpanElement | null)[]>([])
  const [cell, setCell] = useState({ width: 0, height: 0 })
  const { isRevealed } = useEmbedthonReveal()
  const { caption, words } = BRIEF[event]

  useEffect(() => {
    const measure = () => {
      const width = document.documentElement.clientWidth || window.innerWidth
      const height = window.innerHeight
      const size = width < 768 ? CELL_PHONE : CELL_DESKTOP
      const cols = Math.ceil(width / size)
      const rows = Math.ceil(height / size)
      setCell({ width: width / cols, height: height / rows })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  /*
   * Everything above the fold is gated behind the pixel reveal, so the section is
   * measured while that curtain still has the page clamped. Recomputing once it
   * lifts is what makes the scrub line up with the real scroll.
   */
  useEffect(() => {
    if (!isRevealed) return
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [isRevealed])

  /*
   * The words are set in vw units, so a long one ("MEET PEOPLE", "COMPETE.")
   * is wider than its half-width column and used to be clipped by the column's
   * overflow. Shrink only the words that would overflow, keeping the cap from
   * the stylesheet for the ones that already fit - short words stay monumental,
   * long ones come back into the column and stay readable.
   */
  useEffect(() => {
    const fit = () => {
      const elements = words
        .map((_, index) => items.current[index])
        .filter(Boolean) as HTMLSpanElement[]

      // Reset first, so each measurement is against the stylesheet size rather
      // than a size this function already reduced.
      for (const word of elements) word.style.fontSize = ''

      for (const word of elements) {
        const available = word.clientWidth
        const needed = word.scrollWidth
        if (!available || needed <= available) continue

        const base = Number.parseFloat(window.getComputedStyle(word).fontSize)
        word.style.fontSize = `${base * (available / needed) * FIT_MARGIN}px`
      }
    }

    fit()

    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    }

    window.addEventListener('resize', onResize)
    void document.fonts?.ready.then(fit)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [words])

  useGSAP(
    () => {
      const words_ = items.current.filter(Boolean) as HTMLSpanElement[]
      if (!words_.length || !root.current) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (const word of words_) {
          word.style.transform = 'none'
          word.style.opacity = '1'
        }
        return
      }

      gsap.registerPlugin(ScrollTrigger)

      const mm = gsap.matchMedia()

      // Desktop: Each word enters from bottom-right, lines up in the middle at 45% viewport, and goes up hidden
      mm.add('(min-width: 1024px)', () => {
        const tweens = words_.map((word) =>
          gsap.fromTo(
            word,
            {
              x: () => {
                const currentX = (gsap.getProperty(word, 'x') as number) || 0
                const rect = word.getBoundingClientRect()
                const restingLeft = rect.left - currentX
                const viewportWidth = document.documentElement.clientWidth || window.innerWidth
                return viewportWidth - restingLeft
              },
            },
            {
              x: 0,
              ease: 'power1.out',
              scrollTrigger: {
                trigger: word,
                start: 'top bottom',
                end: 'top 45%',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          ),
        )

        return () => {
          for (const tween of tweens) tween.kill()
          for (const word of words_) {
            word.style.transform = ''
            word.style.opacity = ''
          }
        }
      })

      // Mobile: 1:1 Santalarch mobile fallback
      mm.add('(max-width: 1023px)', () => {
        gsap.set(words_, { xPercent: 0, opacity: 0.05 })

        const triggers = words_.map((word) =>
          ScrollTrigger.create({
            trigger: word,
            start: 'top 55%',
            end: 'bottom 45%',
            onToggle: (self) => {
              word.style.opacity = self.isActive ? '1' : '0.05'
            },
          }),
        )

        return () => {
          for (const st of triggers) st.kill()
          for (const word of words_) {
            word.style.transform = ''
            word.style.opacity = ''
          }
        }
      })

      const refresh = () => ScrollTrigger.refresh()
      const timers = [window.setTimeout(refresh, 600), window.setTimeout(refresh, 1800)]
      window.addEventListener('load', refresh)
      void document.fonts?.ready.then(refresh)

      return () => {
        for (const timer of timers) window.clearTimeout(timer)
        window.removeEventListener('load', refresh)
        mm.revert()
      }
    },
    { scope: root, dependencies: [event] },
  )

  return (
    <section
      ref={root}
      id="brief"
      aria-label="The brief"
      // The top margin is the crest's height: the dome sits in that gap, below the
      // hero's first screen, and the hero shows through it until the dome arrives.
      className="light relative z-30 mt-[var(--crest-h)] scroll-mt-16 overflow-x-clip bg-background text-foreground"
      style={{ ['--crest-h' as string]: 'clamp(7rem, min(28svh, 40vw), 17rem)' }}
    >
      <BriefCrest cell={cell} />
      {/* Light theme copper PCB grid on the same 88px rhythm as WavyThemeReveal */}
      {cell.width > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)',
            backgroundSize: `${cell.width}px ${cell.height}px`,
          }}
        />
      )}

      <div className="relative z-10 grid grid-cols-1 px-5 pt-[10svh] pb-10 lg:grid-cols-2 lg:pb-[35svh] lg:pl-16 lg:pr-0">
        {/* Left Column: Pinned Sticky Caption (IDEAS / LEARN) */}
        <div className="col-span-1">
          <div className="relative lg:sticky lg:top-[calc(50svh-4rem)]">
            <span className="block text-[clamp(4rem,12vw,13rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.07em]">
              {caption}
            </span>
          </div>
        </div>

        {/* Right Column: Kinetic Word Stream (.words-wrap with overflow-hidden) */}
        <div className="col-span-1 mt-8 flex flex-col items-start lg:mt-0 w-full overflow-hidden">
          <div className="w-full overflow-hidden">
            {words.map((word, index) => (
              <span
                key={word}
                ref={(el) => {
                  items.current[index] = el
                }}
                className="block w-full text-[clamp(3.5rem,11.5vw,12.5rem)] font-extrabold uppercase leading-[0.87] tracking-[-0.07em] opacity-[0.05] transition-opacity duration-300 will-change-transform lg:whitespace-nowrap lg:opacity-100 lg:transition-none"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
