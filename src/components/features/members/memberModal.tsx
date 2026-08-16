'use client'

import { CutoutCorner } from '@/components/common/cutoutCard'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { Github, Globe, Instagram, Linkedin, Twitter, X, Youtube } from 'lucide-react'
import { animate, motion, useReducedMotion } from 'motion/react'
import type React from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface MemberModalData {
  id: string
  fullName: string
  image: string
  /** Most recent role first — the rest read as roles previously held. */
  roles: string[]
  years?: string
  bio?: string
  github?: string
  linkedin?: string
  socials: { platform: string; url: string }[]
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  other: Globe,
}

const PLATFORM_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  other: 'Website',
}

/**
 * Every platform the club records, shown whether or not this member has one.
 * The ask was to say what is available *and* what is not, so an absent account
 * is a muted row rather than a gap the reader has to infer.
 */
const TRACKED_PLATFORMS = ['github', 'linkedin', 'instagram', 'twitter'] as const

function SocialRow({ platform, url }: { platform: string; url?: string }) {
  const Icon = PLATFORM_ICONS[platform] ?? Globe
  const label = PLATFORM_LABELS[platform] ?? platform

  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground/60">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="ml-auto text-xs">Not available</span>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">View</span>
    </a>
  )
}

/** Where the panel starts from, expressed as a transform off its final box. */
interface FlipFrom {
  x: number
  y: number
  scale: number
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1]
const DURATION = 0.32

export function MemberModal({
  member,
  onClose,
  originRect,
}: {
  member: MemberModalData
  onClose: () => void
  /** The clicked card's box, so the panel can grow out of it. */
  originRect?: DOMRect | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const flipRef = useRef<FlipFrom | null>(null)
  const closingRef = useRef(false)

  /**
   * Play the panel back into the card before unmounting.
   *
   * Every close path goes through here, so the modal always leaves the way it
   * arrived. Guarded, because the button, Escape and an outside click can all
   * fire before the animation finishes.
   */
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const panel = containerRef.current
    const flip = flipRef.current

    // Nothing to play to, or nobody watching. A hidden page throttles both rAF
    // and timers — Chrome drops background timers to about once a minute — so
    // an exit animation there does not merely look wrong, it strands the modal
    // open until the tab is focused again.
    if (!panel || !flip || reduceMotion || document.visibilityState !== 'visible') {
      onClose()
      return
    }

    if (overlayRef.current) {
      animate(overlayRef.current, { opacity: 0 }, { duration: DURATION * 0.8, ease: EASE_IN })
    }

    // Closing must not depend on the animation finishing. A browser that
    // throttles rAF — a backgrounded tab is the easy case — never resolves
    // `finished`, and hanging the unmount off it alone leaves a modal that
    // cannot be dismissed. Whichever comes first wins.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onClose()
    }

    animate(
      panel,
      { x: flip.x, y: flip.y, scale: flip.scale, opacity: 0 },
      { duration: DURATION, ease: EASE_IN },
    ).finished.then(finish, finish)

    setTimeout(finish, DURATION * 1000 + 80)
  }, [onClose, reduceMotion])

  useOutsideClick(containerRef, requestClose)

  /**
   * FLIP, measured once against the clicked card.
   *
   * Deliberately not motion's `layoutId`: that registers every card in the grid
   * as a layout participant and measures the whole set on each open, which is
   * what costs frames on a weak phone. Here one box is read, and the animation
   * runs entirely on `transform` and `opacity` — compositor-only properties, so
   * there is no layout or paint work per frame.
   *
   * The inverse transform is written synchronously in `useLayoutEffect`, before
   * the browser paints. Setting it from a normal effect would show the panel at
   * its final size for one frame first, which is the flash this avoids.
   */
  useLayoutEffect(() => {
    const panel = containerRef.current
    if (!panel) return

    // Same reasoning as the close path: on a hidden page the animation cannot
    // tick, so show the panel in its final state rather than inverted.
    if (!originRect || reduceMotion || document.visibilityState !== 'visible') {
      panel.style.opacity = '1'
      return
    }

    const box = panel.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) {
      panel.style.opacity = '1'
      return
    }

    // One uniform scale, taken from width. Scaling each axis to match the card
    // exactly would stretch the panel's text and corner radius as it grows.
    const flip: FlipFrom = {
      x: originRect.left + originRect.width / 2 - (box.left + box.width / 2),
      y: originRect.top + originRect.height / 2 - (box.top + box.height / 2),
      scale: Math.max(0.2, Math.min(originRect.width / box.width, 1)),
    }
    flipRef.current = flip

    // Invert now, play to identity next.
    panel.style.transformOrigin = 'center center'
    panel.style.transform = `translate(${flip.x}px, ${flip.y}px) scale(${flip.scale})`
    panel.style.opacity = '1'
    // Hinted only for the duration of the move; a permanent `will-change`
    // keeps a compositor layer alive and costs memory on weak devices.
    panel.style.willChange = 'transform, opacity'

    // Separate x / y / scale rather than one `transform` string: motion
    // interpolates these natively and composes the matrix itself, where a full
    // transform string is treated as a discrete value and simply snaps.
    // Explicit two-value keyframes so the animation starts exactly where the
    // inversion above left the panel, with no first-frame jump.
    const controls = animate(
      panel,
      { x: [flip.x, 0], y: [flip.y, 0], scale: [flip.scale, 1] },
      { duration: DURATION, ease: EASE_OUT },
    )
    controls.finished.then(
      () => {
        panel.style.willChange = 'auto'
      },
      () => {},
    )

    return () => controls.stop()
  }, [originRect, reduceMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', onKey)
    }
  }, [requestClose])

  if (typeof document === 'undefined') return null

  const [currentRole, ...previousRoles] = member.roles
  const byPlatform = new Map(member.socials.map((s) => [s.platform, s.url]))
  if (member.github) byPlatform.set('github', member.github)
  if (member.linkedin) byPlatform.set('linkedin', member.linkedin)

  // Anything recorded beyond the tracked set still deserves a row.
  const extra = member.socials.filter(
    (s) => !TRACKED_PLATFORMS.includes(s.platform as (typeof TRACKED_PLATFORMS)[number]),
  )

  // Same shape as the event and project modals: svh so the panel matches the
  // viewport actually on screen, auto margins so a tall one starts at its own
  // top instead of overflowing past it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Blur only from md up. `backdrop-filter` is re-evaluated every frame
          while the panel moves over it, and on a low-end phone that alone can
          halve the frame rate — the flat wash reads the same at this opacity. */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 h-full w-full bg-black/80 md:backdrop-blur-lg"
      />

      {/* A plain element, driven by the FLIP above rather than by `initial` /
          `animate` props: those are evaluated on the first render, and the
          starting transform is not known until the panel has been measured. */}
      <div
        ref={containerRef}
        style={{ opacity: 0 }}
        className={cn(
          'relative z-[60] my-auto max-h-[85svh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card font-sans text-card-foreground md:max-h-[90svh]',
          'shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)]',
        )}
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close member profile"
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid max-h-[85svh] grid-cols-1 gap-6 overflow-y-auto p-3 md:max-h-[90svh] md:grid-cols-[minmax(0,17rem)_1fr] md:gap-8 md:p-8">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
            <img src={member.image} alt={member.fullName} className="h-full w-full object-cover" />
            {member.years && (
              <span className="absolute right-0 top-0 z-10 rounded-bl-[16px] bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                {member.years}
                <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-card" />
                <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-card" />
              </span>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                {member.fullName}
              </h2>
              {currentRole && (
                <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-primary">
                  {currentRole}
                </p>
              )}
            </div>

            {previousRoles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Previously
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {previousRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {member.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Socials
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TRACKED_PLATFORMS.map((platform) => (
                  <SocialRow key={platform} platform={platform} url={byPlatform.get(platform)} />
                ))}
                {extra.map((s) => (
                  <SocialRow key={`${s.platform}-${s.url}`} platform={s.platform} url={s.url} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
