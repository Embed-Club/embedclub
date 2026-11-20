'use client'

import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardImage,
  CutoutCardInsetLabel,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'
import { animate, motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { eventDetails } from './eventType'

const EVENT_HREF = '/embers'
const TRANSITION_DURATION = 0.65
const TRANSITION_DURATION_MS = TRANSITION_DURATION * 1000
const TRANSITION_EASE = [0.65, 0, 0.35, 1] as const

/**
 * The Embed Days chooser: one card in the same cutout style the Resources,
 * Tutorials and Events pages use. Opening it slides the whole shell out of the way
 * under a sheet of copper that stays up until /embers has loaded, then breaks into
 * pixels there (see `embers/loading.tsx` and `CopperPageReveal`).
 */
export function EmbedDaysPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const details = eventDetails.embers

  useEffect(() => {
    router.prefetch(EVENT_HREF)
  }, [router])

  const openEvent = () => {
    if (leaving) return

    if (reduceMotion) {
      router.push(EVENT_HREF)
      return
    }

    // CSS.escape, because the class name contains a slash.
    const shell = document.querySelector<HTMLElement>(`.${CSS.escape('group/sidebar-wrapper')}`)
    if (shell) {
      animate(
        shell,
        { x: window.innerWidth },
        { duration: TRANSITION_DURATION, ease: TRANSITION_EASE },
      )
    }

    setLeaving(true)
    window.setTimeout(() => router.push(EVENT_HREF), TRANSITION_DURATION_MS)
  }

  return (
    <>
      <div className="grid h-full w-full grid-cols-1 gap-4 px-2 pt-16 sm:grid-cols-2 md:gap-6 md:pt-32 lg:grid-cols-3 xl:grid-cols-4">
        <CutoutCard className="h-full">
          <button
            type="button"
            onClick={openEvent}
            disabled={leaving}
            aria-label={`Open: ${details.name}`}
            className={cn(
              cutoutCardSurfaceClassName,
              'flex h-full w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            {/* The mark is dark-on-dark artwork, so its well is the dark palette. */}
            <CutoutCardMedia className="dark h-44 shrink-0 bg-background">
              <CutoutCardImage
                alt=""
                src="/embersLogoBackdrop.webp"
                sizes="(max-width: 768px) 100vw, 20rem"
                className="object-contain p-4 [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_10px_hsl(var(--primary)/0.3))]"
              />
              <CutoutCardOverlay />

              <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[16px] bg-card px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  {details.date}
                </span>
                <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
                <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
              </CutoutCardInsetLabel>
            </CutoutCardMedia>

            <CutoutCardContent className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover/cutout:text-primary">
                {details.name}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{details.label}</p>

              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <span className="text-xs text-muted-foreground">{details.location}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/cutout:border-primary group-hover/cutout:bg-primary group-hover/cutout:text-primary-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CutoutCardContent>
          </button>
        </CutoutCard>
      </div>

      {leaving &&
        createPortal(
          <motion.div
            aria-hidden="true"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: TRANSITION_DURATION, ease: TRANSITION_EASE }}
            className="pointer-events-none fixed inset-0 z-[10000] bg-primary"
          />,
          document.body,
        )}
    </>
  )
}
