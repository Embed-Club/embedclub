'use client'

import { type Variants, motion, useReducedMotion } from 'motion/react'
import React from 'react'

export interface TextRevealProps {
  children?: React.ReactNode
  text?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  className?: string
  /**
   * Classes for the inner flex track that holds the split words. The track is
   * shrink-to-fit until the text wraps, at which point it fills the line box -
   * so a centred heading needs `justify-center` here or its wrapped lines pack
   * left inside a full-width container.
   */
  innerClassName?: string
  style?: React.CSSProperties
  /**
   * How the text is split. `auto` (the default) splits by word, except for
   * one-word text, which splits by character - see the note on the component.
   */
  by?: 'word' | 'character' | 'line' | 'auto'
  /** Defaults to 0.09 per word, or 0.025 per character. */
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
 *
 * `by="auto"` splits one-word text by character instead of by word. Splitting
 * "RESOURCES" by word yields a single piece, so there is nothing to stagger and
 * the whole word slides up as one block - next to a multi-word heading running
 * the same component, it reads as a different animation entirely. The
 * per-character stagger is tightened so the sweep across one word takes about
 * as long as a few words do, rather than crawling letter by letter.
 */
export function TextReveal({
  children,
  text,
  as: Component = 'h2',
  className = '',
  innerClassName = '',
  style,
  by = 'auto',
  stagger,
  duration = 0.85,
  delay = 0,
  once = true,
  amount = 'some',
  margin = '0px 0px -25% 0px',
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const rawText = text ?? getTextFromChildren(children)

  const splitBy = React.useMemo(() => {
    if (by !== 'auto') return by
    return rawText.trim().split(/\s+/).filter(Boolean).length < 2 ? 'character' : 'word'
  }, [by, rawText])

  const items = React.useMemo(() => {
    if (!rawText) return []
    if (splitBy === 'character') {
      return Array.from(rawText)
    }
    if (splitBy === 'line') {
      return rawText.split('\n')
    }
    return rawText.split(/\s+/).filter(Boolean)
  }, [rawText, splitBy])

  // 0.09 per word, not 0.06: against a 0.85s travel, three words at 0.06 spread
  // over 0.18s and land close enough to read as one block - the same complaint
  // single-word titles had before the character split. 0.09 puts a three-word
  // title in the same 0.25s ballpark as a nine-letter one.
  const itemStagger = stagger ?? (splitBy === 'character' ? 0.025 : 0.09)

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : itemStagger,
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

  const gapClass = splitBy === 'character' ? 'gap-x-0' : 'gap-x-[0.28em]'

  return (
    <Component className={className} style={style} aria-label={rawText}>
      <motion.span
        className={`inline-flex flex-wrap items-baseline ${gapClass} leading-tight ${innerClassName}`}
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
