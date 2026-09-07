'use client'

import { trackEvent } from '@/lib/trackEvent'
import { Check, Copy } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

interface CopyButtonProps {
  code: string
  /** Recorded with the copy count, so it is clear which snippets get used. */
  language?: string
}

export function CopyButton({ code, language }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const reduceMotion = useReducedMotion()
  const resetTimer = useRef<number | null>(null)

  // Copying a second snippet before the first reset fires would otherwise
  // leave the tick stuck on, or clear it early.
  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    },
    [],
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      trackEvent('code_copy', language)
      setCopied(true)
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      // The code block's header is dark in both colour modes (Shiki renders
      // github-dark either way), so this uses fixed light-on-dark values
      // instead of the theme tokens - those turned into a pale grey box on
      // the dark header in light mode.
      className="relative flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px"
      aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
      title={copied ? 'Copied' : 'Copy to clipboard'}
    >
      <AnimatePresence initial={false} mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="flex text-emerald-400"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="flex"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Screen readers get the result without the icon swap doing the talking. */}
      <output className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </output>
    </button>
  )
}
