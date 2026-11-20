'use client'

import { cn } from '@/lib/utils'
import { useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'

/**
 * Wispr Flow marquee: a continuous line of words drifting along a looped bezier
 * path. Adapted from the Aceternity registry block
 * (`@aceternity/wispr-flow-text-animation`).
 *
 * Deliberate differences from the demo:
 * - colours come from tokens only (AGENTS.md 1), so the sky-blue edit handles,
 *   the white ring and the near-black text are gone, and the edit-mode chrome
 *   is dropped because it was a playground affordance, not page content;
 * - the loop period is measured from the rendered glyphs, so the text wraps
 *   without the jump the demo gets when its fixed offset restarts;
 * - the line holds still for reduced-motion readers.
 */

type Point = { x: number; y: number }
type Cubic = { p0: Point; p1: Point; p2: Point; p3: Point }

const VIEW_WIDTH = 1048
const VIEW_HEIGHT = 594

/** The registry's flow line: a long S with a loop folded into the middle. */
const CUBICS: Cubic[] = [
  {
    p0: { x: 0.597656, y: 50.924805 },
    p1: { x: 17.4612, y: 143.2965 },
    p2: { x: 97.8522, y: 293.141 },
    p3: { x: 284.508, y: 353.548 },
  },
  {
    p0: { x: 284.508, y: 353.548 },
    p1: { x: 440.828, y: 399.056 },
    p2: { x: 583.839, y: 294.067 },
    p3: { x: 500.618, y: 184.7492 },
  },
  {
    p0: { x: 500.618, y: 184.7492 },
    p1: { x: 417.397, y: 75.4309 },
    p2: { x: 238.217, y: 282.098 },
    p3: { x: 499.258, y: 441.668 },
  },
  {
    p0: { x: 499.258, y: 441.668 },
    p1: { x: 551.913, y: 477.802 },
    p2: { x: 817.468, y: 561.26 },
    p3: { x: 1046.43, y: 565.235 },
  },
]

/**
 * The bottom-left corner is the same line rotated half a turn. Reflecting every
 * point and reversing the segments keeps the path travelling left to right, so
 * the words stay upright while the loop turns to nest in that corner.
 */
const reflect = (p: Point): Point => ({ x: VIEW_WIDTH - p.x, y: VIEW_HEIGHT - p.y })
const ROTATED_CUBICS: Cubic[] = [...CUBICS].reverse().map((cubic) => ({
  p0: reflect(cubic.p3),
  p1: reflect(cubic.p2),
  p2: reflect(cubic.p1),
  p3: reflect(cubic.p0),
}))

const toPath = (cubics: Cubic[]) =>
  cubics
    .map((cubic, index) => {
      const move = index === 0 ? `M${cubic.p0.x} ${cubic.p0.y}` : ''
      return `${move}C${cubic.p1.x} ${cubic.p1.y} ${cubic.p2.x} ${cubic.p2.y} ${cubic.p3.x} ${cubic.p3.y}`
    })
    .join('')

const CORNER_PATHS = {
  topRight: toPath(CUBICS),
  bottomLeft: toPath(ROTATED_CUBICS),
} as const

/** Ends on non-breaking spaces so the gap between repeats survives measuring. */
const SEPARATOR = '\u00A0\u00B7\u00A0'
const REPEAT_COUNT = 4
const LABEL_CLASS = 'text-[24px] font-normal tracking-[0.04em]'

interface WisprFlowTextAnimationProps {
  text: string
  corner?: keyof typeof CORNER_PATHS
  /** Travel speed in viewBox units per second. */
  speed?: number
  className?: string
}

export function WisprFlowTextAnimation({
  text,
  corner = 'topRight',
  speed = 90,
  className,
}: WisprFlowTextAnimationProps) {
  const rawId = useId()
  const pathId = `wispr-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const reduceMotion = useReducedMotion()
  const textPathRef = useRef<SVGTextPathElement>(null)
  const measureRef = useRef<SVGTextElement>(null)

  const unit = `${text}${SEPARATOR}`

  useEffect(() => {
    if (reduceMotion) return
    const textPath = textPathRef.current
    const measure = measureRef.current
    if (!textPath || !measure) return

    let unitWidth = 0
    let frame = 0
    let startedAt: number | null = null

    const measureUnit = () => {
      unitWidth = measure.getComputedTextLength()
    }
    measureUnit()

    // The body font may still be loading on first paint, which would measure a
    // fallback face and leave a seam; measure again once it has landed.
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) measureUnit()
    })

    // The hero is covered by the brief and then hidden, but it is still in the
    // page; without this the path text kept being re-laid-out every frame behind
    // an opaque section. Checked a few times a second, not every frame.
    const svg = textPath.ownerSVGElement
    let lastCheck = Number.NEGATIVE_INFINITY
    let visible = true

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now
      if (now - lastCheck > 250) {
        lastCheck = now
        visible =
          document.visibilityState === 'visible' &&
          (svg?.checkVisibility?.({
            checkVisibilityCSS: true,
            visibilityProperty: true,
          } as never) ??
            true)
      }
      if (visible && unitWidth > 0) {
        const travelled = ((now - startedAt) / 1000) * speed
        textPath.setAttribute('startOffset', String(-(travelled % unitWidth)))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [reduceMotion, speed])

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block h-auto w-full select-none overflow-hidden text-primary', className)}
    >
      <path
        id={pathId}
        d={CORNER_PATHS[corner]}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeOpacity={0.22}
        strokeLinecap="round"
      />

      {/* Hidden twin, used only to measure one loop unit in the rendered font. */}
      <text ref={measureRef} x={0} y={-400} className={LABEL_CLASS} fill="none">
        {unit}
      </text>

      <text className={LABEL_CLASS} fill="currentColor" fillOpacity={0.55}>
        <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0">
          {unit.repeat(REPEAT_COUNT)}
        </textPath>
      </text>
    </svg>
  )
}
