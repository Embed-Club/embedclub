'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { getGentleScroll } from './useGentleScroll'

const CELL_PHONE = 64
const CELL_DESKTOP = 88
/** Scroll spent on the cover, in screens, while the light section is held in place. */
const PIN_VIEWPORTS = 1.1
/** Share of the scrub a square takes to pop in. */
const POP = 0.1
/** Share of the scrub a square takes to clear and show the content behind it. */
const CLEAR = 0.14
/** The last square starts no later than this, so every one has finished by the end. */
const LAST_START = 1 - POP - CLEAR
/** How strongly the bottom of the screen goes first. Small: the order stays random. */
const BOTTOM_BIAS = 0.2
/** A new square starts this much smaller than its cell and grows into it. */
const START_SCALE = 0.7

/** Deterministic noise, so the order is random but identical on every visit. */
function noise(x: number, y: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return value - Math.floor(value)
}

const smoothstep = (value: number) => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/**
 * The hand-off from the dark half to the light half, as a puzzle assembling.
 *
 * The light section is held at the top of the screen for a screen or so of scroll.
 * Over its first screen sits a field of dark squares, the same dark as the section
 * above, so on the way in it simply looks like more of that page. Then, as you
 * scroll, squares go off at random across the screen (a few at the bottom first):
 * each pops up as a cream square from a little smaller than its cell, then clears,
 * and what is under it is the piece of the section that belongs there. By the time
 * the last square has cleared the whole first screen of the section is showing and
 * the pin lets go, so the rest of it scrolls up as normal.
 *
 * This is the way the page opens (the copper tiles dissolving off the board), run
 * the other way and driven by the scroll. The order is deterministic noise, so it
 * is random but the same on every visit.
 *
 * Place it as the first child of the light section. It reads its own colours off
 * the section and off the dark tracks section (`#tracks`) so the squares are
 * exactly the colours either side of them, and the squares' rows are counted from
 * the section's top edge, which is where `LightSurface anchor="self"` starts its
 * grid, so the squares land on the same lines as the grid.
 *
 * Visitors who ask for reduced motion get no pin and no cover.
 */
export function PixelCover() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useGSAP(
    () => {
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      const section = wrap?.closest('section')
      const tracks = document.getElementById('tracks')
      const context = canvas?.getContext('2d')
      if (!wrap || !canvas || !section || !tracks || !context) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        wrap.style.display = 'none'
        return
      }

      gsap.registerPlugin(ScrollTrigger)

      let cols = 0
      let rows = 0
      let cellWidth = 0
      let cellHeight = 0
      let cream = ''
      let dark = ''
      let thresholds = new Float32Array(0)
      let progress = 0
      let palette: 'dark' | 'light' = 'dark'

      const measure = () => {
        const pageWidth = document.documentElement.clientWidth || window.innerWidth
        const viewport = window.innerHeight
        const size = pageWidth < 768 ? CELL_PHONE : CELL_DESKTOP
        cols = Math.ceil(pageWidth / size)
        rows = Math.ceil(viewport / size)
        cellWidth = pageWidth / cols
        cellHeight = viewport / rows

        wrap.style.height = `${viewport}px`

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.floor(pageWidth * dpr)
        canvas.height = Math.floor(viewport * dpr)
        canvas.style.width = `${pageWidth}px`
        canvas.style.height = `${viewport}px`
        context.setTransform(dpr, 0, 0, dpr, 0, 0)

        // When each square starts. Mostly random, with a light lean toward the
        // bottom of the screen so the cover begins where the section comes from.
        thresholds = new Float32Array(cols * rows)
        for (let row = 0; row < rows; row++) {
          const fromBottom = rows === 1 ? 0 : (rows - 1 - row) / (rows - 1)
          for (let col = 0; col < cols; col++) {
            const random = noise(col + 1, row + 1)
            thresholds[row * cols + col] =
              (random * (1 - BOTTOM_BIAS) + fromBottom * BOTTOM_BIAS) * LAST_START
          }
        }

        // Read off the sections themselves, so every square is exactly the colour
        // on either side of it, whatever the tokens say.
        const sectionStyle = window.getComputedStyle(section)
        cream = sectionStyle.backgroundColor
        dark = window.getComputedStyle(tracks).backgroundColor
      }

      const draw = () => {
        context.clearRect(0, 0, cols * cellWidth, rows * cellHeight)

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const elapsed = progress - thresholds[row * cols + col]
            const pop = smoothstep(elapsed / POP)
            const clear = smoothstep((elapsed - POP) / CLEAR)
            if (clear >= 1) continue

            const x = col * cellWidth
            const y = row * cellHeight

            // Until a square has popped it is dark, the same dark as above.
            if (pop < 1) {
              context.globalAlpha = 1
              context.fillStyle = dark
              context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5)
            }
            if (pop <= 0) continue

            // Pop: a cream square grows from the cell's centre. Clear: it fades
            // and the section's own content is what is left.
            const scale = START_SCALE + (1 - START_SCALE) * pop
            const width = cellWidth * scale
            const height = cellHeight * scale
            context.globalAlpha = pop * (1 - clear)
            context.fillStyle = cream
            context.fillRect(
              x + (cellWidth - width) / 2,
              y + (cellHeight - height) / 2,
              width + 0.5,
              height + 0.5,
            )
          }
        }
        context.globalAlpha = 1
      }

      // The dock decides its own palette from what is behind it. This overlay is
      // dark when it starts and cream by the end, so say which once half the
      // squares are in.
      const sync = () => {
        wrap.style.display = progress >= 1 ? 'none' : 'block'
        const next = progress >= 0.5 ? 'light' : 'dark'
        if (next === palette) return
        palette = next
        wrap.setAttribute('data-theme', next)
      }

      measure()

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * PIN_VIEWPORTS)}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure()
          progress = self.progress
          draw()
          sync()
        },
        onUpdate: (self) => {
          progress = self.progress
          draw()
          sync()
        },
      })

      /*
       * A link into the light half has to account for the pin. Before the section
       * has been pinned its layout is one screen shorter than it will be once the
       * pin has played out, so a plain anchor jump lands a screen early, and a jump
       * to the section's own top lands at the start of the cover, on a dark
       * screen. Send those links to where the target will be after the pin
       * instead: the pin's end plus the target's offset inside the section.
       */
      const onClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0) return
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
        const hash = link?.getAttribute('href')
        if (!link || !hash || hash.length < 2) return
        const target = document.getElementById(hash.slice(1))
        if (!target || !section.contains(target)) return

        event.preventDefault()
        event.stopPropagation()

        const inside = target.getBoundingClientRect().top - section.getBoundingClientRect().top
        const margin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
        const destination = Math.max(trigger.end, trigger.end + inside - margin)
        const lenis = getGentleScroll()
        if (lenis) lenis.scrollTo(destination)
        else window.scrollTo(0, destination)
        window.history.replaceState(null, '', hash)
      }
      document.addEventListener('click', onClick, true)

      return () => document.removeEventListener('click', onClick, true)
    },
    { scope: wrapRef },
  )

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-theme="dark"
      // Above the section's content. It takes pointer events, so the dock's hit
      // test reads this layer's palette while it is up and nothing under it can be
      // clicked before it has cleared.
      className="absolute inset-x-0 top-0 z-30 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
