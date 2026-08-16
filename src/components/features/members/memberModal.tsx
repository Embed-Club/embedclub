'use client'

import { CutoutCorner } from '@/components/common/cutoutCard'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { Github, Globe, Instagram, Linkedin, Twitter, X, Youtube } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
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

/**
 * The card's box expressed as a transform off the panel's final box.
 *
 * Scaled per axis, not uniformly: the card is 4:5 and the panel is much wider
 * than it is tall, so one scale factor cannot describe the change. The content
 * is counter-scaled by the inverse of these, which is what keeps the text from
 * stretching while the container morphs.
 */
interface FlipFrom {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

// Milliseconds and CSS easing: these drive the Web Animations API, not motion.
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)'
const DURATION = 320

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
  const innerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
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

    if (!panel || !flip || reduceMotion) {
      onClose()
      return
    }

    // Closing must not depend on the animation finishing. A browser that
    // throttles rAF — a backgrounded tab is the easy case — may never resolve
    // `finished`, and hanging the unmount off it alone leaves a modal that
    // cannot be dismissed. Whichever comes first wins.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onClose()
    }

    const options: KeyframeAnimationOptions = {
      duration: DURATION,
      easing: EASE_IN,
      fill: 'both',
    }

    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION * 0.8,
      easing: EASE_IN,
      fill: 'both',
    })

    // The content goes first and faster, so the frame is empty before it
    // shrinks — collapsing a full panel of text reads as a squash otherwise.
    bodyRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION * 0.35,
      easing: EASE_IN,
      fill: 'both',
    })

    innerRef.current?.animate(
      [
        { transform: 'scale(1, 1)' },
        { transform: `scale(${1 / flip.scaleX}, ${1 / flip.scaleY})` },
      ],
      options,
    )

    panel
      .animate(
        [
          { transform: 'translate(0px, 0px) scale(1, 1)' },
          {
            transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`,
          },
        ],
        options,
      )
      .finished.then(finish, finish)

    setTimeout(finish, DURATION + 80)
  }, [onClose, reduceMotion])

  useOutsideClick(containerRef, requestClose)

  /**
   * Container transform: the panel morphs out of the clicked card's box.
   *
   * The container is scaled per axis from the card's size to its own, and the
   * inner wrapper is scaled by the *inverse* at the same time. The two cancel,
   * so the content keeps its true proportions throughout while the frame around
   * it changes shape — a card 320×400 becoming a panel 768×620 without the text
   * stretching on the way.
   *
   * Deliberately not width/height: those are layout properties, so every frame
   * would relayout and repaint the panel, its image and its text. `transform`
   * is composite-only, which is the difference between smooth and stuttering on
   * a mid-range phone. Both surfaces already use a 16px radius, so there is no
   * border-radius to animate either.
   *
   * Not motion's `layoutId` either: that registers all 55 cards as layout
   * participants and measures the set on every open.
   *
   * `useLayoutEffect` so the inverted transform lands before the first paint;
   * from a normal effect the panel would flash at full size for one frame.
   */
  useLayoutEffect(() => {
    const panel = containerRef.current
    const inner = innerRef.current
    const body = bodyRef.current
    if (!panel || !inner) return

    // A hidden page does not tick: the animation is created and reports as
    // running, but currentTime stays at 0, so `fill: backwards` would hold the
    // panel at card size until the tab is looked at again. Open plainly here.
    if (!originRect || reduceMotion || document.visibilityState !== 'visible') {
      panel.style.opacity = '1'
      return
    }

    const box = panel.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) {
      panel.style.opacity = '1'
      return
    }

    // Top-left origin on both, so the maths is a plain corner-to-corner offset
    // rather than a centre offset that has to account for each scale.
    const flip: FlipFrom = {
      x: originRect.left - box.left,
      y: originRect.top - box.top,
      scaleX: Math.max(0.05, originRect.width / box.width),
      scaleY: Math.max(0.05, originRect.height / box.height),
    }
    flipRef.current = flip

    // Clear anything still attached. Closing one profile and opening another
    // remounts this component, but React reuses the same DOM nodes, so the
    // previous close animation survives — and with `fill: 'both'` it keeps
    // asserting its end state against the opening one.
    for (const el of [panel, inner, body]) {
      if (el) for (const a of el.getAnimations()) a.cancel()
    }

    panel.style.transformOrigin = '0 0'
    inner.style.transformOrigin = '0 0'
    panel.style.opacity = '1'
    // Hinted only for the duration of the move; a permanent `will-change`
    // keeps a compositor layer alive and costs memory on weak devices.
    panel.style.willChange = 'transform'
    inner.style.willChange = 'transform'

    const from = `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`
    const to = 'translate(0px, 0px) scale(1, 1)'
    const innerFrom = `scale(${1 / flip.scaleX}, ${1 / flip.scaleY})`

    // Native Web Animations rather than motion's imperative `animate`. That
    // helper drives values from JavaScript on rAF and, on these elements, went
    // straight to the end state — the modal simply appeared, with no morph at
    // all. These run on the compositor, off the main thread, which is also why
    // they hold up on a slow device.
    //
    // `backwards`, not `both`. Both would hold the *first* keyframe after the
    // animation ends as well, so an interrupted or never-ticked opening leaves
    // the panel frozen at card size — a modal stuck as a thumbnail. Backwards
    // holds the start only before it begins; once done the element falls back
    // to its own style, which is already the open state.
    const options: KeyframeAnimationOptions = {
      duration: DURATION,
      easing: EASE_OUT,
      fill: 'backwards',
    }

    const panelAnim = panel.animate([{ transform: from }, { transform: to }], options)
    const innerAnim = inner.animate(
      [{ transform: innerFrom }, { transform: 'scale(1, 1)' }],
      options,
    )

    // The content is held back and faded in once the frame is most of the way
    // there. Revealing it from the first frame is what makes a morph read as a
    // squashed screenshot rather than a container opening.
    const bodyAnim = body?.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: DURATION * 0.55, delay: DURATION * 0.45, easing: EASE_OUT, fill: 'backwards' },
    )

    Promise.all([panelAnim.finished, innerAnim.finished]).then(
      () => {
        panel.style.willChange = 'auto'
        inner.style.willChange = 'auto'
      },
      () => {},
    )

    return () => {
      panelAnim.cancel()
      innerAnim.cancel()
      bodyAnim?.cancel()
    }
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
        {/* Counter-scaled against the container above, so the content keeps its
            true proportions while the frame morphs. Sized to the container's
            unscaled box — layout runs before transforms, so 100% here is the
            panel's real size, not its scaled-down one. The container clips the
            overflow, which is what makes the frame read as opening. */}
        <div ref={innerRef} className="h-full w-full">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close member profile"
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            ref={bodyRef}
            className="grid max-h-[85svh] grid-cols-1 gap-6 overflow-y-auto p-3 md:max-h-[90svh] md:grid-cols-[minmax(0,17rem)_1fr] md:gap-8 md:p-8"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
              <img
                src={member.image}
                alt={member.fullName}
                className="h-full w-full object-cover"
              />
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
      </div>
    </div>,
    document.body,
  )
}
