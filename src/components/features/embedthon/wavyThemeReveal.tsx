'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

/**
 * Computes the Gaussian wave polygon formula.
 *
 * Begins directly on the hero text carousel line ((1 - p) * 100%), with the wave crest
 * surging upwards above the carousel to push it away. Accelerates smoothly so the wave
 * fully reaches the top of the viewport and flattens out completely by p = 0.82,
 * ensuring zero black strips or wedges remain at the top before handing off to Manifesto.
 *
 * @param progress 0 (wave below bottom, 0% height) to 1 (wave fully cleared past top, 100% height)
 * @param peakX peak horizontal center point (defaults to 0.5, centered)
 * @returns CSS clip-path polygon string with 33 sampled Gaussian points
 */
export function getWavePolygon(progress: number, peakX = 0.5): string {
  const p = Math.max(0, Math.min(1, progress))
  const u = Math.min(1, p / 0.82)
  const d = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
  const amplitude = 30 * Math.sin(Math.PI * u)
  const baseline = 100 * (1 - d)
  const points: string[] = []

  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    const z = (t - peakX) / 0.3
    const y = baseline - amplitude * Math.exp(-z * z)
    points.push(`${(t * 100).toFixed(2)}% ${Math.min(105, y).toFixed(2)}%`)
  }

  return `polygon(${points.join(', ')}, 100% 120%, 0% 120%)`
}

/**
 * Fullscreen wavy theme reveal overlay (Team Cafeteria style).
 *
 * Sweeps smoothly from the bottom of the viewport directly beneath the marquee
 * as the user scrolls from the dark hero into the manifesto section.
 * Contains the warm-white background, the light copper PCB matrix grid, and the
 * Manifesto text so they emerge together in perfect unison.
 */
export function WavyThemeReveal() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { setTheme } = useTheme()
  const [grid, setGrid] = useState({ cols: 0, rows: 0 })

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
      if (!rootRef.current) return
      gsap.registerPlugin(ScrollTrigger)

      const waveEl = rootRef.current
      let activeTheme: 'dark' | 'light' = 'dark'

      const getDock = () => document.getElementById('embedthon-floating-dock')
      const getDockMobile = () => document.getElementById('embedthon-floating-dock-mobile')

      ScrollTrigger.create({
        start: 0,
        end: () => window.innerHeight,
        scrub: 0.15,
        onUpdate: (self) => {
          const p = self.progress
          const dock = getDock()
          const dockMobile = getDockMobile()

          if (p <= 0.001) {
            waveEl.style.opacity = '0'
            dock?.removeAttribute('data-theme')
            dockMobile?.removeAttribute('data-theme')
            if (activeTheme !== 'dark') {
              activeTheme = 'dark'
              setTheme('dark')
            }
            return
          }

          waveEl.style.opacity = '1'
          waveEl.style.clipPath = getWavePolygon(p, 0.5)

          // As soon as the wave peak rolls past the floating dock (bottom ~92%, p >= 0.06),
          // transform the dock into light mode
          if (p >= 0.06) {
            dock?.setAttribute('data-theme', 'light')
            dockMobile?.setAttribute('data-theme', 'light')
          } else {
            dock?.removeAttribute('data-theme')
            dockMobile?.removeAttribute('data-theme')
          }

          // When the wave is near the top (p >= 0.8), switch global theme to light.
          // When scrolling back up (p < 0.8), switch global theme back to dark so the hero is dark.
          if (p >= 0.8) {
            if (activeTheme !== 'light') {
              activeTheme = 'light'
              setTheme('light')
            }
          } else {
            if (activeTheme !== 'dark') {
              activeTheme = 'dark'
              setTheme('dark')
            }
          }

          // When the wave fully clears the top of the viewport (p >= 1.0),
          // hand off seamlessly to Manifesto which has an identical light background and grid.
          if (p >= 1.0) {
            waveEl.style.display = 'none'
          } else {
            waveEl.style.display = 'block'
          }
        },
        onLeave: () => {
          waveEl.style.display = 'none'
          getDock()?.setAttribute('data-theme', 'light')
          getDockMobile()?.setAttribute('data-theme', 'light')
          if (activeTheme !== 'light') {
            activeTheme = 'light'
            setTheme('light')
          }
        },
        onEnterBack: () => {
          waveEl.style.display = 'block'
          getDock()?.setAttribute('data-theme', 'light')
          getDockMobile()?.setAttribute('data-theme', 'light')
        },
        onLeaveBack: () => {
          waveEl.style.opacity = '0'
          getDock()?.removeAttribute('data-theme')
          getDockMobile()?.removeAttribute('data-theme')
          if (activeTheme !== 'dark') {
            activeTheme = 'dark'
            setTheme('dark')
          }
        },
      })
    },
    { scope: rootRef },
  )

  return (
    <div
      ref={rootRef}
      id="embedthon-wave-hero"
      aria-hidden="true"
      className="light pointer-events-none fixed inset-0 z-20 overflow-hidden bg-background text-foreground"
      style={
        {
          clipPath: 'polygon(0% 105%, 100% 105%, 100% 105%, 0% 105%)',
          opacity: 0,
          willChange: 'clip-path',
        } as React.CSSProperties
      }
    >
      {/* Light theme copper PCB grid matching CopperMatrixGrid dimensions 1:1 */}
      {grid.cols > 0 && (
        <div
          className="absolute inset-0 grid h-full w-full select-none"
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

      {/*
       * Background and grid only. The brief itself lives in Manifesto, which the
       * wave hands off to - carrying a second copy of the sentence in here meant
       * the page showed the old static paragraph over the new section.
       */}
    </div>
  )
}
