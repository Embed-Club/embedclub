'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react'

export interface CarouselNavProps {
  /** Number of scroll snaps — one dot each. */
  snapCount: number
  selectedIndex: number
  canScrollPrev: boolean
  canScrollNext: boolean
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
  /**
   * Hold time per card, matching the carousel's autoplay delay. The active dot
   * fills over exactly this long, so the bar is a real countdown to the next
   * card rather than decoration. Omit when nothing auto-advances.
   */
  autoDelaySeconds?: number
  /**
   * Whether the carousel's autoplay timer is running *right now* — it stops on
   * hover, on drag, and while the tab is hidden. False holds the bar where it
   * is: a bar that keeps filling while the carousel is parked says a card is
   * about to change when nothing is going to happen.
   */
  autoRunning?: boolean
  /**
   * Changes whenever a fresh timer starts, restarting the countdown. Not the
   * card index: leaving the carousel with the mouse gives the current card a
   * full new delay, so the bar has to start over without the card changing.
   */
  restartKey?: number
}

/**
 * Prev/next plus a dot per card, in one pill under the carousel.
 *
 * Replaces two bare arrows. They moved the track but said nothing about how
 * many cards there were or which one you were on, and with `loop: true` there
 * is no start or end to feel your way to — so on a long row of events the
 * arrows gave no sense of position at all.
 *
 * All colour is tokens (`secondary`/`primary`/`muted`), not the per-slide
 * palettes the original sketch shipped with: the theme is locked to Solder &
 * Copper and new accent hues are out (AGENTS.md §1). The sketch's palette
 * switching was also inert — it fed Tailwind class strings like `bg-zinc-100`
 * to `animate={{ backgroundColor }}`, which is not a colour.
 */
export const CarouselNav = ({
  snapCount,
  selectedIndex,
  canScrollPrev,
  canScrollNext,
  onPrev,
  onNext,
  onSelect,
  autoDelaySeconds,
  autoRunning = false,
  restartKey = 0,
}: CarouselNavProps) => {
  const reduceMotion = useReducedMotion()

  if (snapCount < 2) return null

  // Mounted on capability, not on whether it happens to be running: unmounting
  // it on hover swapped in the plain bar below, which reads as the countdown
  // jumping to complete at the exact moment the carousel stopped.
  const showCountdown = Boolean(autoDelaySeconds) && !reduceMotion

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: a <nav> landmark for two
      // arrows and some dots adds noise to the landmark list; the group label
      // is what a screen reader user actually needs here.
      role="group"
      aria-label="Carousel navigation"
      className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-sm"
    >
      <ArrowButton label="Previous events" onClick={onPrev} disabled={!canScrollPrev}>
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      </ArrowButton>

      <div className="flex items-center gap-1.5 px-2">
        {Array.from({ length: snapCount }, (_, i) => {
          const isActive = i === selectedIndex
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: one dot per snap, never reordered
              key={`dot${i}`}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Go to card ${i + 1} of ${snapCount}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'relative h-2.5 overflow-hidden rounded-full',
                // Width is a CSS transition rather than Motion's `layout`
                // prop: the fill inside is a scaleX transform, and a
                // layout-projected parent rescales its children mid-flight,
                // which visibly stretches the bar as the dot expands.
                'motion-safe:transition-[width,background-color] motion-safe:duration-300 motion-safe:ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                isActive
                  ? 'w-10 bg-muted'
                  : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
              )}
            >
              {isActive &&
                (showCountdown ? (
                  // Remounted per timer, which is what zeroes the bar.
                  <ProgressFill
                    key={restartKey}
                    durationMs={(autoDelaySeconds ?? 0) * 1000}
                    running={autoRunning}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full bg-primary" />
                ))}
            </button>
          )
        })}
      </div>

      <ArrowButton label="Next events" onClick={onNext} disabled={!canScrollNext}>
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </ArrowButton>
    </div>
  )
}

interface ArrowButtonProps {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

const ArrowButton = ({ children, label, onClick, disabled }: ArrowButtonProps) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    whileTap={disabled ? undefined : { scale: 0.92 }}
    className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50"
  >
    {children}
  </motion.button>
)

/**
 * The active dot's countdown.
 *
 * Advanced by frame delta rather than by a fixed-duration animation, because
 * autoplay pauses on hover and resumes from where it left off. A declarative
 * 0→100% tween can only be restarted or completed, not held; accumulating
 * deltas and skipping the frames where nothing is running gives the bar the
 * same pause the carousel has.
 */
const ProgressFill = ({ durationMs, running }: { durationMs: number; running: boolean }) => {
  const progress = useMotionValue(0)

  useAnimationFrame((_, delta) => {
    if (!running || durationMs <= 0) return
    const next = progress.get() + delta / durationMs
    progress.set(next > 1 ? 1 : next)
  })

  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX: progress, originX: 0 }}
      className="absolute inset-0 rounded-full bg-primary"
    />
  )
}
