'use client'

import { useEmbedthonReveal } from '@/components/features/embedthon/embedthonRevealContext'
import { useEffect, useRef } from 'react'

/**
 * Oakley/Monogrid-style page reveal for Embedthon.
 *
 * Sizing, column/row count, and cell coordinates are matched 1:1 with
 * CopperMatrixGrid (CELL_PHONE = 64, CELL_DESKTOP = 88) so that every dissolving
 * copper tile aligns precisely over the underlying background PCB matrix cell.
 */

const CELL_PHONE = 64
const CELL_DESKTOP = 88
const GUTTER = 2.5
const SEPARATE_MS = 320
const DISSOLVE_MS = 680
const TOTAL_MS = SEPARATE_MS + DISSOLVE_MS

interface GridTile {
  x: number
  y: number
  w: number
  h: number
  /** Deterministic pseudo-random threshold in [0, 1] */
  threshold: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Deterministic 2D pseudo-random hash identical to GLSL fract(sin(dot(...)) * 43758.5453) */
function hash(x: number, y: number): number {
  const sin = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return sin - Math.floor(sin)
}

export function CopperPageReveal() {
  const root = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { setRevealed } = useEmbedthonReveal()

  useEffect(() => {
    const rootEl = root.current
    const canvas = canvasRef.current
    if (!rootEl || !canvas) return

    // Ensure element is visible on mount
    rootEl.style.display = 'block'

    const hide = () => {
      rootEl.style.display = 'none'
    }

    // Visitors who ask for less motion get the page straight away: no curtain,
    // and no content held back at opacity 0 waiting for it to finish.
    const ctx = canvas.getContext('2d')
    if (!ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hide()
      setRevealed(true)
      return
    }

    // Match CopperMatrixGrid dimensions exactly (measuring the layer bounds,
    // which excludes the vertical scrollbar, rather than window.innerWidth)
    const rect = rootEl.getBoundingClientRect()
    const width = rect.width || document.documentElement.clientWidth || window.innerWidth
    const height = rect.height || document.documentElement.clientHeight || window.innerHeight
    const size = width < 768 ? CELL_PHONE : CELL_DESKTOP
    const cols = Math.ceil(width / size)
    const rows = Math.ceil(height / size)
    const cellW = width / cols
    const cellH = height / rows

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Resolve the active copper token for the canvas.
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    const fill = `hsl(${primary})`

    const tiles: GridTile[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        tiles.push({
          x: col * cellW,
          y: row * cellH,
          w: cellW,
          h: cellH,
          threshold: hash(col + 1, row + 1),
        })
      }
    }

    const render = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = fill

      // Phase 1: Solid body pulls apart into distinct squares aligned to background grid
      const sep = clamp01(elapsed / SEPARATE_MS)
      const easeSep = 1 - (1 - sep) ** 3
      const currentGutter = GUTTER * easeSep

      // Phase 2: Random tile disappearance
      const dissolveProgress =
        elapsed > SEPARATE_MS ? clamp01((elapsed - SEPARATE_MS) / DISSOLVE_MS) : 0

      for (const tile of tiles) {
        if (dissolveProgress > 0) {
          // Sharp snap-out window around the tile's pseudo-random threshold
          const t = (dissolveProgress - tile.threshold) / 0.12
          if (t >= 1) continue // Completely gone, reveals page and background grid cell

          const alpha = t <= 0 ? 1 : 1 - t
          const shrink = t <= 0 ? 1 : 1 - 0.25 * t
          const w = (tile.w - currentGutter) * shrink
          const h = (tile.h - currentGutter) * shrink
          const offsetX = (tile.w - w) / 2
          const offsetY = (tile.h - h) / 2

          ctx.globalAlpha = alpha
          ctx.fillRect(tile.x + offsetX, tile.y + offsetY, w, h)
        } else {
          // Solid / Separating phase
          const w = tile.w - currentGutter
          const h = tile.h - currentGutter
          const offsetX = currentGutter / 2
          const offsetY = currentGutter / 2

          ctx.globalAlpha = 1
          ctx.fillRect(tile.x + offsetX, tile.y + offsetY, w, h)
        }
      }

      ctx.globalAlpha = 1
    }

    // Paint initial solid frame immediately before removing the transition curtain
    render(0)

    let raf = 0
    let finished = false
    const start = performance.now()

    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      hide()
      setRevealed(true)
    }

    const draw = (now: number) => {
      const elapsed = now - start
      render(elapsed)

      if (elapsed < TOTAL_MS) {
        raf = requestAnimationFrame(draw)
        return
      }

      finish()
    }

    raf = requestAnimationFrame(draw)

    // Fallback watchdog timer
    const watchdog = window.setTimeout(finish, TOTAL_MS + 250)

    return () => {
      finished = true
      cancelAnimationFrame(raf)
      window.clearTimeout(watchdog)
      rootEl.style.removeProperty('display')
    }
  }, [setRevealed])

  return (
    <div
      ref={root}
      id="embedthon-reveal"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[10000] select-none"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
