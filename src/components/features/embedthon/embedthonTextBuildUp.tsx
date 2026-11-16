'use client'

import { useEmbedthonReveal } from '@/components/features/embedthon/embedthonRevealContext'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { EventType } from './eventType'

interface EmbedthonTextBuildUpProps {
  className?: string
  event: EventType
}

/**
 * Animated SVG text build-up for EMBERS '26.
 *
 * 1. Stroke drawing runs first: a thin, razor-sharp outline draws the glyphs (strokeWidth: 0.75).
 * 2. Immediately upon stroke completion, a radial mask centered at (50%, 50%) blooms outward,
 *    filling the word with solid copper color from the middle to the outside.
 */
export function EmbedthonTextBuildUp({ className, event }: EmbedthonTextBuildUpProps) {
  const { isRevealed } = useEmbedthonReveal()
  const [fillActive, setFillActive] = useState(false)

  useEffect(() => {
    if (!isRevealed) {
      setFillActive(false)
    }
  }, [isRevealed])

  // Center coordinates for radial mask in 945x135 viewBox
  const cx = 472.5
  const cy = 67.5
  const maxRadius = 550

  return (
    <div className={className}>
      <h1 className="sr-only">{event === 'embers' ? "Embers '26" : 'Embedthon'}</h1>

      <svg
        aria-hidden="true"
        viewBox="0 0 945 135"
        preserveAspectRatio="xMinYMid meet"
        className="block h-auto w-full select-none overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="embersCenterFillMask" maskUnits="userSpaceOnUse">
            {/* Background black: everything concealed */}
            <rect x="0" y="0" width="945" height="135" fill="black" />
            {/* White expanding circle: reveals copper fill from inside out */}
            <motion.circle
              cx={cx}
              cy={cy}
              initial={{ r: 0 }}
              animate={fillActive ? { r: maxRadius } : { r: 0 }}
              transition={{
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
              fill="white"
            />
          </mask>
        </defs>

        {/* Layer 1: Solid copper fill masked to bloom from middle to outside */}
        <text
          x="0"
          y="114"
          textAnchor="start"
          className="font-extrabold uppercase"
          mask="url(#embersCenterFillMask)"
          style={{
            fontFamily: 'var(--font-tex-gyre-adventor), sans-serif',
            fontSize: '150px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fill: 'hsl(var(--primary))',
          }}
        >
          {event === 'embers' ? "EMBERS'26" : 'EMBEDTHON'}
        </text>

        {/* Layer 2: Thin, crisp stroke drawing that animates first */}
        <motion.text
          x="0"
          y="114"
          textAnchor="start"
          className="font-extrabold uppercase"
          style={{
            fontFamily: 'var(--font-tex-gyre-adventor), sans-serif',
            fontSize: '150px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fill: 'transparent',
            stroke: 'hsl(var(--primary))',
            strokeWidth: 0.75,
          }}
          initial={{
            strokeDasharray: 4500,
            strokeDashoffset: 4500,
          }}
          animate={
            isRevealed
              ? {
                  strokeDashoffset: 0,
                }
              : {
                  strokeDashoffset: 4500,
                }
          }
          transition={{
            duration: 1.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.05,
          }}
          onAnimationComplete={() => {
            if (isRevealed) {
              setFillActive(true)
            }
          }}
        >
          {event === 'embers' ? "EMBERS'26" : 'EMBEDTHON'}
        </motion.text>
      </svg>
    </div>
  )
}
