'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { clearDockTheme, setDockTheme } from './chromeTheme'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

/**
 * Trigger progress at which the whole sheet is lit and the document theme
 * flips. The cells are painted in the page's own background colour, so the
 * sheet can only be retired once the section behind it has fully replaced it:
 * any earlier and the tail of the dark section above pops in at the top of the
 * screen the instant the sheet drops.
 */
const FLIP_AT = 0.999
/** How far behind the first column the last one may start. */
const COLUMN_STAGGER = 0.2
/** Sideways tilt of the front, so it reads as a diagonal sweep not stairs. */
const COLUMN_LEAN = 0.04
/** Per-cell jitter, so the front is ragged instead of pixel-perfect. */
const CELL_WOBBLE = 0.02
/** Nothing may sit above this, or the top row could be stranded. */
const MAX_THRESHOLD = 0.985
/** Below this the sheet is not painting anything and leaves the dock alone. */
const IDLE_AT = 0.001

/** Stable pseudo-noise: the ragged edge is identical on every reload. */
function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

/**
 * Light sheet that flips the page from the dark schedule to the light lower
 * half at the "Guidelines and arrangements" boundary.
 *
 * The sheet is a fixed grid of `bg-background` cells that turn on in a
 * bottom-up, column-staggered front as the section rises into view - the ragged
 * cube edge *is* the colour boundary, the way the hero wave's crest is. The
 * cells are the page's own background colour and tile with no gaps, so the
 * last of them landing makes the viewport one flat plane; at that same moment
 * the document theme flips to light and the sheet drops away. Scrolling back up
 * runs the whole thing in reverse, cell by cell.
 *
 * The sheet lives inside `#venue` but is `fixed`, above every section and below
 * the dock. While it paints it owns the dock palette (the sheet is light, and
 * it sits behind the dock) and `isWavePainting()` keeps the dock's own sampler
 * from fighting it.
 */
export function PixelThemeSweep() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const cellsRef = useRef<(HTMLDivElement | null)[]>([])
  const columnStartRef = useRef<Float32Array>(new Float32Array(0))
  const columnSpanRef = useRef(0.78)
  const thresholdsRef = useRef<Float32Array>(new Float32Array(0))
  const paintedRef = useRef<Uint8Array>(new Uint8Array(0))
  const progressRef = useRef(0)
  const requestedThemeRef = useRef<'light' | 'dark' | null>(null)
  const resolvedThemeRef = useRef<string | undefined>(undefined)
  const [grid, setGrid] = useState({ cols: 0, rows: 0 })
  const { resolvedTheme, setTheme } = useTheme()

  /*
   * Hiding the sheet is the one step that must wait for the document to really
   * be light: `setTheme` lands a frame after the call, and dropping the sheet on
   * the same frame as the request would flash the still-dark section for a
   * frame. So the hand-off is confirmed here, against the progress the trigger
   * last reported.
   */
  useEffect(() => {
    resolvedThemeRef.current = resolvedTheme
    const sheet = sheetRef.current
    if (!sheet) return
    if (resolvedTheme === 'light' && progressRef.current >= FLIP_AT) {
      sheet.style.display = 'none'
    }
  }, [resolvedTheme])

  useEffect(() => {
    const measure = () => {
      const width = document.documentElement.clientWidth || window.innerWidth
      const height = window.innerHeight
      const size = width < 768 ? CELL_PHONE : CELL_DESKTOP
      const cols = Math.ceil(width / size)
      const rows = Math.ceil(height / size)

      /*
       * Column head starts: fixed-seed noise, then one smoothing pass so the
       * front leans across the page instead of speckling. The lean is added on
       * top so the sweep always travels the same direction.
       */
      const raw = new Float32Array(cols)
      for (let column = 0; column < cols; column++) raw[column] = noise(column + 1)

      const start = new Float32Array(cols)
      let latest = 0
      for (let column = 0; column < cols; column++) {
        const left = raw[Math.max(0, column - 1)]
        const right = raw[Math.min(cols - 1, column + 1)]
        const smoothed = (left + raw[column] * 2 + right) / 4
        const lean = COLUMN_LEAN * (cols === 1 ? 0 : column / (cols - 1) - 0.5)
        start[column] = smoothed * COLUMN_STAGGER + lean
        latest = Math.max(latest, start[column])
      }

      /*
       * One span for every column, sized so the slowest column's top cell lights
       * at exactly t = 1. Without that the last cells could light well before the
       * hand-off and leave the viewport a blank light plane while the reader is
       * still scrolling toward the section.
       */
      const span = Math.max(0.25, (1 - latest) / MAX_THRESHOLD)

      // Thresholds are measured from the bottom of the sheet, which fills first.
      const thresholds = new Float32Array(cols * rows)
      for (let row = 0; row < rows; row++) {
        const fromBottom = rows === 1 ? 0 : (rows - 1 - row) / (rows - 1)
        for (let column = 0; column < cols; column++) {
          const wobble = (noise(column * 131 + row * 977 + 7) - 0.5) * 2 * CELL_WOBBLE
          thresholds[row * cols + column] = Math.min(
            MAX_THRESHOLD,
            Math.max(0, fromBottom + wobble),
          )
        }
      }

      columnStartRef.current = start
      columnSpanRef.current = span
      thresholdsRef.current = thresholds
      paintedRef.current = new Uint8Array(cols * rows)
      cellsRef.current = []
      setGrid({ cols, rows })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useGSAP(
    () => {
      const sheet = sheetRef.current
      if (!sheet || !grid.cols || !grid.rows) return

      const section = sheet.closest('section')
      if (!section) return

      gsap.registerPlugin(ScrollTrigger)

      const paint = (progress: number) => {
        progressRef.current = progress

        const t = Math.min(1, Math.max(0, progress / FLIP_AT))
        const { cols, rows } = grid
        const starts = columnStartRef.current
        const span = columnSpanRef.current
        const thresholds = thresholdsRef.current
        const painted = paintedRef.current

        let litCount = 0
        for (let column = 0; column < cols; column++) {
          const columnFill = (t - starts[column]) / span
          for (let row = 0; row < rows; row++) {
            const index = row * cols + column
            const lit = columnFill >= thresholds[index] - 1e-4 ? 1 : 0
            if (lit) litCount += 1
            // Only touch the DOM on a state change: a frame usually flips one or
            // two cells, not the whole grid.
            if (painted[index] === lit) continue
            painted[index] = lit
            const cell = cellsRef.current[index]
            if (cell) cell.style.opacity = lit ? '1' : '0'
          }
        }

        if (progress <= IDLE_AT) {
          // Never write the theme here: above this section the hero owns it, and
          // an init-time write would fight the hero's own trigger.
          sheet.style.display = 'none'
          clearDockTheme()
          requestedThemeRef.current = null
          return
        }

        sheet.style.display =
          progress >= FLIP_AT && resolvedThemeRef.current === 'light' ? 'none' : 'block'

        /*
         * The dock goes light as soon as the paint reaches it - the sheet is a
         * light plane sitting behind the dock, so leaving it dark would put a
         * dark pill on cream. Before the first cell lands there is nothing
         * behind it to match, so the dock's own sampler keeps control.
         */
        if (litCount > 0) setDockTheme('light')
        else clearDockTheme()

        const wanted: 'light' | 'dark' = progress >= FLIP_AT ? 'light' : 'dark'
        if (requestedThemeRef.current !== wanted) {
          requestedThemeRef.current = wanted
          setTheme(wanted)
        }
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.15,
        onUpdate: (self) => paint(self.progress),
        /*
         * Every edge callback repaints the trigger's own progress rather than a
         * guessed 0 or 1. ScrollTrigger fires these alongside `onUpdate`, so a
         * hard-coded value here would land last and win, pinning the sheet to a
         * fully flipped state on the way back up.
         */
        onLeave: (self) => paint(self.progress),
        onEnterBack: (self) => paint(self.progress),
        onLeaveBack: (self) => paint(self.progress),
      })

      // A deep link can land past the boundary with no scroll event to start it.
      paint(trigger.progress)

      return () => trigger.kill()
    },
    { scope: sheetRef, dependencies: [grid] },
  )

  return (
    <div
      ref={sheetRef}
      id="embedthon-pixel-venue"
      aria-hidden="true"
      className="light pointer-events-none fixed inset-0 z-40 overflow-hidden"
      style={{ display: 'none' }}
    >
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
              ref={(element) => {
                cellsRef.current[index] = element
              }}
              className="bg-background"
              style={{ opacity: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
