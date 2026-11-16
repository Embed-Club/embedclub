'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'
import type { EventType } from './eventType'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

const EMBERS_BRIEF =
  'IDEAS BECOME THINGS HERE. BRING A PROJECT. SHARE A PAPER. MEET PEOPLE WHO BUILD. LEARN. COMPETE. LEAVE WITH SOMETHING NEW.'

const EMBEDTHON_BRIEF =
  'LEARN THE AGENT WORKFLOW. BUILD WITH YOUR TEAM. TURN A PROMPT INTO SOFTWARE THAT WORKS.'

/**
 * The page's scroll-scrubbed brief.
 *
 * Words illuminate sequentially from 0.38 to 1.0 as the section is scrolled through.
 * Has the warm-white background and light copper PCB grid so the handoff from
 * WavyThemeReveal at the top of the section is completely seamless with zero flash.
 */
export function Manifesto({ event }: { event: EventType }) {
  const root = useRef<HTMLElement>(null)
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([])
  const [grid, setGrid] = useState({ cols: 0, rows: 0 })
  const words = (event === 'embers' ? EMBERS_BRIEF : EMBEDTHON_BRIEF)
    .split(' ')
    .map((text, id) => ({ id: `brief-word-${id}`, text }))

  useEffect(() => {
    const measure = () => {
      const width = document.documentElement.clientWidth || window.innerWidth
      const height = window.innerHeight
      const size = width < 768 ? CELL_PHONE : CELL_DESKTOP
      const cols = Math.ceil(width / size)
      const rows = Math.ceil(height / size)
      setGrid({ cols, rows })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useGSAP(
    () => {
      const words = wordsRef.current.filter(Boolean) as HTMLSpanElement[]
      if (!words.length || !root.current) return

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        for (const word of words) word.style.opacity = '1'
        return
      }

      gsap.registerPlugin(ScrollTrigger)

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.15,
        onUpdate: (self) => {
          const p = self.progress
          const totalWords = words.length

          for (let i = 0; i < totalWords; i++) {
            const wordEl = words[i]
            const start = i / totalWords
            const end = (i + 1) / totalWords

            if (p <= start) {
              wordEl.style.opacity = '0.38'
            } else if (p >= end) {
              wordEl.style.opacity = '1'
            } else {
              const frac = (p - start) / (end - start)
              wordEl.style.opacity = String(0.38 + 0.62 * frac)
            }
          }
        },
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="brief"
      aria-label="The brief"
      className="light relative h-[210vh] scroll-mt-16 bg-background text-foreground"
    >
      <div className="sticky top-0 flex min-h-svh items-center overflow-hidden bg-background">
        {/* Light theme copper PCB grid matching WavyThemeReveal dimensions 1:1 */}
        {grid.cols > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid h-full w-full select-none"
            style={{
              gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
              gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
            }}
          >
            {Array.from({ length: grid.cols * grid.rows }).map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed visual substrate, never reordered
                key={index}
                className="border-b border-r border-border/35 bg-primary/[0.025]"
              />
            ))}
          </div>
        )}

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-14">
          <p className="max-w-[26ch] text-[clamp(1.7rem,4.6vw,3.9rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.025em] text-foreground sm:max-w-[22ch] lg:max-w-[24ch]">
            {words.map((item, index) => (
              <span
                key={item.id}
                ref={(el) => {
                  wordsRef.current[index] = el
                }}
                className="inline-block transition-opacity duration-75"
                style={{ opacity: 0.38 }}
              >
                {item.text}&nbsp;
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
