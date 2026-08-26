'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import {
  CutoutCardInsetLabel,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { SimulatorVideo } from '@/components/features/simulators/simulatorVideo'
import { useCardMorph } from '@/hooks/useCardMorph'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { Download, ExternalLink, SquareArrowOutUpRight, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SimulatorModalProps {
  simulator: SimulatorCardData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The clicked card's box, so the panel can grow out of it. */
  originRect?: DOMRect | null
}

/**
 * Simulators live on someone else's site (Wokwi, Tinkercad, …). Rather than
 * navigating away the moment a card is clicked, this modal explains what the
 * tool is, plays the walkthrough video, and lets the student choose whether to
 * open it in this tab or a new one.
 */
export function SimulatorModal({ simulator, open, onOpenChange, originRect }: SimulatorModalProps) {
  // Nothing rendered until it is open: the morph measures the panel in a layout
  // effect, so the panel has to exist the moment that effect runs.
  if (!simulator || !open || typeof document === 'undefined') return null

  return createPortal(
    <SimulatorModalPanel
      simulator={simulator}
      originRect={originRect}
      onClose={() => onOpenChange(false)}
    />,
    document.body,
  )
}

/** The panel itself. Split out so it mounts and unmounts with the open flag. */
function SimulatorModalPanel({
  simulator,
  originRect,
  onClose,
}: {
  simulator: SimulatorCardData
  originRect?: DOMRect | null
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const { panelRef, innerRef, bodyRef, overlayRef, requestClose } = useCardMorph({
    originRect,
    onClose,
    reduceMotion,
  })

  useOutsideClick(panelRef, requestClose)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [requestClose])

  const { title, description, image, launchUrl, launchType, videoUrl, content } = simulator
  // A desktop tool sends them to a download page, so "Open simulator" would
  // be a lie. The label is set per simulator in the admin.
  const isDownload = launchType === 'download'
  const hasInstructions = Array.isArray(content) && content.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
      // biome-ignore lint/a11y/useSemanticElements: a native <dialog> is only
      // modal via showModal(), which puts it in the browser's top layer - that
      // layer establishes its own containing block and stacking context, which
      // breaks the measured transform the morph animates. This replaced a Radix
      // Dialog, so dropping the role would lose semantics the page already had.
      role="dialog"
      aria-modal="true"
      aria-label={title}
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

      <div
        ref={panelRef}
        style={{ opacity: 0 }}
        className={cn(
          'relative z-[60] my-auto max-h-[85svh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card text-card-foreground md:max-h-[90svh]',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        {/* Counter-scaled against the panel, so the content holds its true
            proportions while the frame morphs. */}
        <div ref={innerRef} className="h-full w-full">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close simulator"
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>

          <div ref={bodyRef} className="max-h-[85svh] overflow-y-auto md:max-h-[90svh]">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-2xl bg-muted">
              <Image
                alt={title}
                src={image}
                fill
                sizes="(max-width: 768px) 95vw, 48rem"
                className="object-contain"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

              <CutoutCardInsetLabel className="bottom-0 left-0 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-2.5">
                <span className="text-lg font-extrabold [-webkit-text-stroke:0.5px] leading-snug text-card-foreground">
                  {title}
                </span>
                <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
                <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
              </CutoutCardInsetLabel>
            </div>

            <div className="flex flex-col gap-6 p-6">
              <p className="text-sm font-semibold text-muted-foreground">{description}</p>

              {videoUrl ? <SimulatorVideo url={videoUrl} title={title} /> : null}

              {launchUrl ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={launchUrl}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {isDownload ? (
                      <Download className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {isDownload ? 'Download App' : 'Open Website'}
                  </a>
                  <a
                    href={launchUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <SquareArrowOutUpRight className="h-4 w-4" />
                    Open in new tab
                  </a>
                </div>
              ) : (
                // `launchUrl` is required for new simulators, but rows created
                // before it existed can still be missing one.
                <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  This simulator has no link yet - an organizer needs to add one.
                </p>
              )}

              {hasInstructions ? (
                <div className="border-border border-t pt-4">
                  <h3 className="mb-3 font-extrabold  text-sm uppercase tracking-widest text-muted-foreground">
                    How to use
                  </h3>
                  <BlockRenderer blocks={content} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
