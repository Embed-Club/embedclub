'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { SimulatorVideo } from '@/components/features/simulators/simulatorVideo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExternalLink, SquareArrowOutUpRight } from 'lucide-react'

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

  const { title, description, launchUrl, videoUrl, content } = simulator
  const hasInstructions = Array.isArray(content) && content.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
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
