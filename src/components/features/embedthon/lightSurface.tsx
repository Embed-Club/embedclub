'use client'

import { cn } from '@/lib/utils'
import { type ComponentProps, useEffect, useRef, useState } from 'react'

const CELL_PHONE = 64
const CELL_DESKTOP = 88

/**
 * A section that is light on its own account.
 *
 * The page's document theme is dark above the venue and is never flipped on the
 * way down, because a flip restyles every element on the page in one frame and
 * that is what made the scroll stutter. So a section that should be light says
 * so itself: the `light` class gives it the palette, and it paints its own
 * cream background and copper grid instead of showing the fixed board behind.
 *
 * The grid is the brief's, continued: same cell size, and its lines are shifted
 * so they line up with the brief's lattice rather than restarting at this
 * section's top edge, which would show as a jog in the lines at every seam.
 */
export function LightSurface({
  className,
  children,
  anchor = 'brief',
  grid: showGrid = true,
  ...rest
}: ComponentProps<'section'> & {
  /**
   * What the grid lines line up with. 'brief' continues the brief's lattice, for
   * sections that sit right below it; 'self' starts the lattice at this section's
   * own top edge, for a section that is separated from the brief by a dark one
   * and needs its squares to line up with its own pixel crest.
   */
  anchor?: 'brief' | 'self'
  /** False for a plain cream surface with no grid lines at all. */
  grid?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [grid, setGrid] = useState({ width: 0, height: 0, offset: 0 })

  useEffect(() => {
    const section = ref.current
    if (!section || !showGrid) return

    const measure = () => {
      const pageWidth = document.documentElement.clientWidth || window.innerWidth
      const size = pageWidth < 768 ? CELL_PHONE : CELL_DESKTOP
      const width = pageWidth / Math.ceil(pageWidth / size)
      const height = window.innerHeight / Math.ceil(window.innerHeight / size)

      // Both tops move together as the page scrolls, so their gap is stable.
      const target = anchor === 'brief' ? document.getElementById('brief') : null
      const gap = target
        ? target.getBoundingClientRect().top - section.getBoundingClientRect().top
        : 0
      const offset = ((gap % height) + height) % height

      setGrid((previous) =>
        previous.width === width && previous.height === height && previous.offset === offset
          ? previous
          : { width, height, offset },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [anchor, showGrid])

  return (
    <section
      ref={ref}
      {...rest}
      className={cn('light relative bg-background text-foreground', className)}
    >
      {showGrid && grid.width > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)',
            backgroundSize: `${grid.width}px ${grid.height}px`,
            backgroundPosition: `0 ${grid.offset}px`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  )
}
