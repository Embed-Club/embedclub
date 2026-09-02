'use client'

import { type Variants, motion, useReducedMotion } from 'motion/react'
import React from 'react'

export interface TextRevealProps {
  children?: React.ReactNode
  text?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  className?: string
  style?: React.CSSProperties
  by?: 'word' | 'character' | 'line'
  stagger?: number
  duration?: number
  delay?: number
  once?: boolean
  amount?: number | 'some' | 'all'
  margin?: string
}

/** Extract string representation from React children. */
function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(getTextFromChildren).join('')
  if (React.isValidElement(children) && children.props) {
    return getTextFromChildren((children.props as { children?: React.ReactNode }).children)
  }
  return ''
}

/**
 * Reusable split-text reveal component with skewed slide-up mask animation.
 * Uses `motion/react` with viewport-based intersection triggers.
 */
export function TextReveal({
  children,
  text,
  as: Component = 'h2',
  className = '',
  style,
  by = 'word',
  stagger = 0.06,
  duration = 0.85,
  delay = 0,
  once = true,
  amount = 'some',
  margin = '0px 0px -25% 0px',
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const rawText = text ?? getTextFromChildren(children)

  const items = React.useMemo(() => {
    if (!rawText) return []
    if (by === 'character') {
      return Array.from(rawText)
    }
    if (by === 'line') {
      return rawText.split('\n')
    }
    // Default: 'word'
    return rawText.split(/\s+/).filter(Boolean)
  }, [rawText, by])

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: delay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : {
          y: '120%',
          rotate: 6,
          opacity: 0,
        },
    visible: {
      y: '0%',
      rotate: 0,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.25 : duration,
        ease: [0.16, 1, 0.3, 1], // snappy power4/expo ease - launches fast, finishes smooth
      },
    },
  }

  if (!rawText) return null

  const gapClass = by === 'character' ? 'gap-x-0' : 'gap-x-[0.28em]'

  return (
    <Component className={className} style={style} aria-label={rawText}>
      <motion.span
        className={`inline-flex flex-wrap items-baseline ${gapClass} leading-tight`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount, margin }}
        variants={containerVariants}
        aria-hidden="true"
      >
        {items.map((item, idx) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: pure presentational split spans
            key={`${item}-${idx}`}
            className="inline-block overflow-hidden align-baseline leading-tight py-[0.08em] -my-[0.08em]"
          >
            <motion.span
              variants={itemVariants}
              className="inline-block will-change-transform origin-[50%_100%]"
            >
              {item}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Component>
  )
}

export default TextReveal
