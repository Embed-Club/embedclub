'use client'

import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { ArrowUpRight, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface CreditsModalTriggerProps {
  className?: string
  children?: React.ReactNode
  legacyUrl?: string | null
}

function formatHost(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return rawUrl
  }
}

interface CreditsModalPanelProps {
  isOpen: boolean
  onClose: () => void
  legacyUrl?: string | null
}

function CreditsModalPanel({ isOpen, onClose, legacyUrl }: CreditsModalPanelProps) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useOutsideClick(panelRef, onClose)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  const finalLegacyUrl =
    legacyUrl || process.env.NEXT_PUBLIC_LEGACY_WEBSITE_URL || 'https://embedclub.org/'
  const legacyHost = formatHost(finalLegacyUrl)

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
          style={{
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
          // biome-ignore lint/a11y/useSemanticElements: a native <dialog> is only modal via showModal()
          role="dialog"
          aria-modal="true"
          aria-label="Original Website Tribute"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 h-full w-full bg-black/80 md:backdrop-blur-lg"
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            transition={{
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              'relative z-[60] my-auto max-h-[85svh] w-full max-w-lg overflow-hidden rounded-2xl bg-card text-card-foreground md:max-h-[90svh]',
              'border border-border shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)]',
            )}
          >
            {/* Circular close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tribute modal"
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Body */}
            <div className="max-h-[85svh] overflow-y-auto p-6 sm:p-8 md:max-h-[90svh]">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Digital Heritage</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-foreground">
                  Original Website Tribute
                </h2>
                <p className="text-sm text-muted-foreground">
                  A special acknowledgment to the original creator of Embed Club's digital home.
                </p>
              </div>

              <div className="group mt-6 rounded-2xl border border-border bg-card/50 p-5 sm:p-6 transition-all duration-300 hover:border-primary/60 hover:bg-primary/[0.03]">
                <h3 className="text-lg font-bold text-foreground">
                  Original Developer:{' '}
                  <a
                    href="https://github.com/azlanajju/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-0.5 text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                  >
                    Muhammad Azlan
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Engineered and launched the original{' '}
                  <span className="font-medium text-foreground">{legacyHost}</span> website,
                  pioneering the online foundation for Embed Club and creating the first home for
                  club projects, tutorials, and student initiatives.
                </p>

                <a
                  href={finalLegacyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <span>Visit Original Website ({legacyHost})</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * Trigger button that manages open state and renders the Tribute Modal.
 */
export function CreditsModalTrigger({ className, children, legacyUrl }: CreditsModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          className ??
          'text-xs font-medium text-muted-foreground transition-colors hover:text-primary underline underline-offset-4 cursor-pointer'
        }
      >
        {children ?? 'Original Website Tribute'}
      </button>
      <CreditsModalPanel isOpen={isOpen} onClose={closeModal} legacyUrl={legacyUrl} />
    </>
  )
}

export default CreditsModalTrigger
