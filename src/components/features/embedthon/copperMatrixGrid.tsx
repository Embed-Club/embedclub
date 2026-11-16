'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

/**
 * The page's fixed copper board. Cells are hairlines at rest, so the grid reads
 * as a PCB substrate rather than a wash of orange, and a pointer probe lights
 * the cell under the cursor plus its four neighbours. The probe listens on the
 * window because the page content sits above this layer - listening on the
 * layer itself meant the effect never fired over any section.
 */
export function CopperMatrixGrid() {
  const root = useRef<HTMLDivElement>(null)
  const tiles = useRef<(HTMLDivElement | null)[]>([])
  const probe = useRef<{ cell: number; neighbours: number[] } | null>(null)
  const hasPlayed = useRef(false)
  const [grid, setGrid] = useState({
    cols: 0,
    rows: 0,
    cellW: CELL_DESKTOP,
    cellH: CELL_DESKTOP,
  })

  useEffect(() => {
    const measure = () => {
      // Measure the board itself, not window.innerWidth: the fixed layer is
      // narrower than the window by the scrollbar, and `ceil` makes every cell
      // slightly smaller than the nominal size. Dividing pointer coordinates by
      // the nominal size therefore drifted further off to the right and down.
      const rect = root.current?.getBoundingClientRect()
      const width = rect?.width || window.innerWidth
      const height = rect?.height || window.innerHeight
      const size = width < 768 ? CELL_PHONE : CELL_DESKTOP
      const cols = Math.ceil(width / size)
      const rows = Math.ceil(height / size)

      setGrid({ cols, rows, cellW: width / cols, cellH: height / rows })
      tiles.current = []
      probe.current = null
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Power-on sweep. Only the first paint animates; a resize just settles the
  // rebuilt cells, otherwise every window drag replayed the whole sequence.
  useGSAP(
    () => {
      const nodes = tiles.current.filter(Boolean) as HTMLDivElement[]
      if (!nodes.length) return

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (hasPlayed.current || reduce) {
        hasPlayed.current = true
        gsap.set(nodes, { opacity: 1 })
        return
      }

      hasPlayed.current = true
      gsap.fromTo(
        nodes,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.55,
          ease: 'power1.out',
          stagger: { each: 0.005, from: 'start' },
          overwrite: true,
        },
      )
    },
    { scope: root, dependencies: [grid] },
  )

  // Probe under the cursor.
  useEffect(() => {
    const clear = () => {
      const current = probe.current
      if (!current) return
      for (const index of [current.cell, ...current.neighbours]) {
        const tile = tiles.current[index]
        if (tile) tile.dataset.probe = 'idle'
      }
      probe.current = null
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !grid.cols) return

      const col = Math.min(grid.cols - 1, Math.floor(event.clientX / grid.cellW))
      const row = Math.min(grid.rows - 1, Math.floor(event.clientY / grid.cellH))
      if (col < 0 || row < 0) return

      const cell = row * grid.cols + col
      if (probe.current?.cell === cell) return
      clear()

      const neighbours = [
        row > 0 ? cell - grid.cols : -1,
        row < grid.rows - 1 ? cell + grid.cols : -1,
        col > 0 ? cell - 1 : -1,
        col < grid.cols - 1 ? cell + 1 : -1,
      ].filter((index) => index >= 0)

      const tile = tiles.current[cell]
      if (tile) tile.dataset.probe = 'hot'
      for (const index of neighbours) {
        const neighbour = tiles.current[index]
        if (neighbour) neighbour.dataset.probe = 'warm'
      }
      probe.current = { cell, neighbours }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [grid])

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden bg-background"
    >
      {grid.cols > 0 ? (
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid.cols * grid.rows }).map((_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed visual substrate, never reordered
              key={index}
              ref={(el) => {
                tiles.current[index] = el
              }}
              className="border-b border-r border-primary/10 bg-primary/[0.025] opacity-0 transition-colors duration-150 data-[probe=hot]:bg-primary/20 data-[probe=warm]:bg-primary/[0.07]"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
