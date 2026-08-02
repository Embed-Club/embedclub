'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import {
  CutoutCardInsetLabel,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { SimulatorVideo } from '@/components/features/simulators/simulatorVideo'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ExternalLink, SquareArrowOutUpRight } from 'lucide-react'
import Image from 'next/image'

interface SimulatorModalProps {
  simulator: SimulatorCardData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Simulators live on someone else's site (Wokwi, Tinkercad, …). Rather than
 * navigating away the moment a card is clicked, this modal explains what the
 * tool is, plays the walkthrough video, and lets the student choose whether to
 * open it in this tab or a new one.
 */
export function SimulatorModal({ simulator, open, onOpenChange }: SimulatorModalProps) {
  if (!simulator) return null

  const { title, description, image, launchUrl, videoUrl, content } = simulator
  const hasInstructions = Array.isArray(content) && content.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto rounded-2xl bg-card p-0 text-card-foreground',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        {/* sr-only — the visible name lives on the cutout label below, same
            treatment as the card it was opened from. Radix still needs a
            real Title/Description pair for screen readers. */}
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>

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
            <span className="text-lg font-semibold leading-snug text-card-foreground">{title}</span>
            <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
            <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
          </CutoutCardInsetLabel>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">{description}</p>

          {videoUrl ? <SimulatorVideo url={videoUrl} title={title} /> : null}

          {launchUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={launchUrl}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open simulator
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
              This simulator has no link yet — an organizer needs to add one.
            </p>
          )}

          {hasInstructions ? (
            <div className="border-border border-t pt-4">
              <h3 className="mb-3 font-semibold text-sm uppercase tracking-widest text-muted-foreground">
                How to use
              </h3>
              <BlockRenderer blocks={content} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
