'use client'

import type { ProjectCardData } from '@/app/(frontend)/projects/projectsPageContent'
import { CutoutCardInsetLabel, CutoutCorner } from '@/components/common/cutoutCard'
import { BlurImage } from '@/components/features/events/eventsCards'
import { useCardMorph } from '@/hooks/useCardMorph'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { ExternalLink, Github, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ProjectModalProps {
  card: ProjectCardData
  onClose: () => void
  layoutId?: string
  /** The clicked tile's box, so the panel can grow out of it. */
  originRect?: DOMRect | null
}

/**
 * Project detail modal - image on the left, details on the right, the same
 * split the events modal uses so both pages read as one system.
 *
 * Mounted only while open (the tile renders it behind `open &&`), so a grid of
 * tiles does not keep one portal, one body-overflow write and two document
 * listeners alive per project - that combination made the page scroll badly.
 * The trade is no exit animation, which nobody sees anyway.
 *
 * The write-up (`card.details`) is rendered on the server and handed down as a
 * node: the block renderer is a server component (Shiki highlights code at
 * build time), so it cannot be imported from here.
 */
export function ProjectModal({ card, onClose, layoutId, originRect }: ProjectModalProps) {
  const reduceMotion = useReducedMotion()
  const { panelRef, innerRef, bodyRef, overlayRef, requestClose } = useCardMorph({
    originRect,
    onClose,
    reduceMotion,
  })

  useOutsideClick(panelRef, requestClose)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [requestClose])

  // Same reason as the events modal: rendered into <body> so no transformed
  // ancestor becomes the containing block for the fixed overlay.
  if (typeof document === 'undefined') return null

  // `items-start` + `my-auto` on the panel, not `items-center`: a centred flex
  // child taller than its container overflows both ways and its top becomes
  // unreachable. The env() padding keeps it clear of the notch and gesture bar.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Blur from md up only: backdrop-filter is re-evaluated every frame
          while the panel moves across it, which is costly on a weak phone. */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 h-full w-full bg-black/80 md:backdrop-blur-lg"
      />
      {/* Plain element: the morph is driven imperatively, and the starting
          transform is not known until the panel has been measured. */}
      <div
        ref={panelRef}
        style={{ opacity: 0 }}
        className={cn(
          // svh, not vh: mobile browsers size vh as though the URL bar were
          // hidden, so the panel's top sits under the browser chrome.
          'relative z-[60] my-auto max-h-[85svh] w-full max-w-6xl overflow-hidden rounded-2xl bg-card font-sans text-card-foreground md:max-h-[90svh]',
          'shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)]',
        )}
      >
        {/* Counter-scaled against the panel, so the content holds its true
            proportions while the frame morphs. */}
        <div ref={innerRef} className="h-full w-full">
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={requestClose}
            aria-label="Close project details"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            ref={bodyRef}
            className="grid h-full max-h-[85svh] grid-cols-1 gap-6 overflow-y-auto p-3 md:max-h-[90svh] md:grid-cols-2 md:gap-8 md:p-8 lg:p-10"
          >
            {/* Image, with the title in the same notched inset label as the
                  card. With no photo the panel is typeset instead - same move
                  the showcase tile makes. */}
            <div className="relative flex h-full min-h-[16rem] items-stretch justify-center overflow-hidden rounded-2xl bg-muted md:sticky md:top-0">
              {card.image ? (
                <>
                  <BlurImage src={card.image} alt={card.title} fill className="object-contain" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                </>
              ) : (
                <div className="flex w-full flex-col justify-center gap-2 p-6 md:p-8">
                  {card.award && (
                    <p className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-primary md:text-5xl">
                      {card.award}
                    </p>
                  )}
                  {(card.event || card.year) && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {[card.event, card.year ? String(card.year) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              )}

              <CutoutCardInsetLabel className="bottom-0 left-0 z-10 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-3 text-left">
                <motion.p
                  layoutId={layoutId ? `title-${card.slug}` : undefined}
                  className="text-base font-semibold text-foreground [text-wrap:balance] md:text-xl"
                >
                  {card.title}
                </motion.p>
                <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
                <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
              </CutoutCardInsetLabel>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-4 md:gap-6">
              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {card.image && card.award && (
                <div>
                  <p className="text-xl font-bold uppercase tracking-tight text-primary">
                    {card.award}
                  </p>
                  {(card.event || card.year) && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {[card.event, card.year ? String(card.year) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm leading-relaxed text-foreground/90">{card.description}</p>

              {card.teamNames.length > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Team
                  </p>
                  <p className="mt-2 text-sm text-foreground">{card.teamNames.join(', ')}</p>
                </div>
              )}

              {(card.repoUrl || card.demoUrl) && (
                <div className="flex flex-wrap items-center gap-3">
                  {card.repoUrl && (
                    <a
                      href={card.repoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Github className="h-4 w-4" />
                      Source code
                    </a>
                  )}
                  {card.demoUrl && (
                    <a
                      href={card.demoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live demo
                    </a>
                  )}
                </div>
              )}

              {card.details && <div className="flex-1">{card.details}</div>}

              <Link
                href={`/projects/${card.slug}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Open the full page →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
