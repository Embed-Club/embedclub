'use client'

import { useCardMorph } from '@/hooks/useCardMorph'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTheme } from 'next-themes'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { setDockTheme } from './chromeTheme'
import { getWavePolygon } from './wavyThemeReveal'

const SCHEDULE = [
  [
    '08:30',
    '09:30',
    'Registration and booth setup',
    'Check in, collect your kit, and prepare your display.',
  ],
  ['09:30', '10:15', 'Inaugural ceremony and keynote', 'The day begins with the opening session.'],
  ['10:15', '10:30', 'High tea and networking', 'Take a break and meet the people in the room.'],
  [
    '10:30',
    '13:00',
    'Project Expo and paper presentations',
    'Explore projects and follow the presentation sessions.',
  ],
  ['13:00', '14:00', 'Lunch break', 'Lunch for registered participants.'],
  ['14:00', '15:45', 'Grand jury defense', 'Shortlisted teams demonstrate their work to the jury.'],
  ['15:45', '16:30', 'Results and awards', 'Winners, prizes, trophies, and certificates.'],
  [
    '16:30',
    'Close',
    'High tea and photo session',
    'A final chance to meet, celebrate, and take the group photo.',
  ],
] as const

/**
 * Two-letter code for a session, the way the reference list abbreviates each
 * project name. First and last word keeps the result short enough to set at
 * display size without clipping.
 */
function sessionCode(title: string): string {
  const words = title.split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words[words.length - 1]?.[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

/** Slot length in minutes, or null when the slot closes the day. */
function slotMinutes(start: string, end: string): number | null {
  const toMinutes = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value)
    return match ? Number(match[1]) * 60 + Number(match[2]) : null
  }
  const from = toMinutes(start)
  const to = toMinutes(end)
  return from === null || to === null ? null : to - from
}

/**
 * One session, opened from its row.
 *
 * Built on the site's own modal system - `useCardMorph` grows the panel out of
 * the row it came from, Escape and a click outside close it - so a session opens
 * the same way every card on the site does instead of fading in from nowhere.
 *
 * No backdrop blur: the sheet is drawn flat over the schedule, which is already
 * a dark surface, and re-evaluating a blur every frame while a panel scales over
 * it is the expensive part on a phone.
 *
 * The panel keeps the row's own surface: square, no border, one shade up. It
 * carries the schedule's dark palette because the portal renders it outside the
 * dark section.
 */
function ScheduleModal({
  session,
  index,
  originRect,
  onClose,
}: {
  session: (typeof SCHEDULE)[number]
  index: number
  originRect: DOMRect
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
    const onKeyDown = (event: KeyboardEvent) => {
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

  if (typeof document === 'undefined') return null

  const [start, end, title, detail] = session
  const minutes = slotMinutes(start, end)

  return createPortal(
    <div
      // biome-ignore lint/a11y/useSemanticElements: a native <dialog> is only
      // modal via showModal(), which puts it in the browser's top layer - that
      // layer establishes its own containing block and stacking context, which
      // breaks the measured transform the card morph animates. Every other modal
      // on the site uses the same role the same way.
      role="dialog"
      aria-modal="true"
      aria-label={`Session ${String(index + 1).padStart(2, '0')}: ${title}`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 h-full w-full bg-black/80"
      />

      <div
        ref={panelRef}
        style={{ opacity: 0 }}
        className="dark relative z-[60] my-auto max-h-[85svh] w-full max-w-xl overflow-hidden bg-secondary font-sans text-foreground shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)] md:max-h-[90svh]"
      >
        <div ref={innerRef} className="h-full w-full">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close session details"
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>

          <div ref={bodyRef} className="max-h-[85svh] overflow-y-auto p-7 sm:p-9 md:max-h-[90svh]">
            <div className="flex items-baseline justify-between gap-6 pr-10 text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-foreground/55">
              <span>{`Session ${String(index + 1).padStart(2, '0')}`}</span>
              <span>
                {start} - {end}
                {minutes === null ? '' : ` / ${minutes} min`}
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground sm:text-4xl">
              {title}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-foreground/75 sm:text-lg">{detail}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ScheduleTimeline() {
  /*
   * A row is a button, and the sentence it opens is the only place the detail
   * exists - the list itself is display type. The opened row's own box is kept
   * so the panel can grow out of the row that was clicked.
   */
  const [open, setOpen] = useState<{ index: number; rect: DOMRect } | null>(null)

  return (
    <>
      <ol
        className="mt-14 border-t border-border/70"
        style={{ '--schedule-display': 'clamp(56px, 21vw, 285px)' } as CSSProperties}
      >
        {SCHEDULE.map(([start, end, title, detail], index) => {
          const minutes = slotMinutes(start, end)

          return (
            <li key={title} className="border-t border-border/70 first:border-t-0">
              <button
                type="button"
                onClick={(event) =>
                  setOpen({ index, rect: event.currentTarget.getBoundingClientRect() })
                }
                aria-haspopup="dialog"
                className="grid w-full grid-cols-2 gap-x-[var(--g)] gap-y-0 overflow-clip pb-[1.3rem] text-left text-foreground/30 transition-colors duration-500 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                style={
                  {
                    '--g': '1.25rem',
                    gridTemplateRows: 'calc(var(--schedule-display) * 230 / 285) auto',
                  } as CSSProperties
                }
              >
                {/* Decorative display pair: session number left, code right. */}
                <span
                  aria-hidden="true"
                  className="block font-bold leading-[0.98] tracking-[-0.01em]"
                  style={{
                    fontSize: 'var(--schedule-display)',
                    height: '0.98em',
                    marginTop: 'calc(var(--schedule-display) * -6 / 285)',
                    marginLeft: 'calc(var(--schedule-display) * -9 / 285)',
                  }}
                >
                  {`S.${String(index + 1).padStart(2, '0')}`}
                </span>
                <span
                  aria-hidden="true"
                  className="block justify-self-start font-bold leading-[0.98] tracking-[-0.01em]"
                  style={{
                    fontSize: 'var(--schedule-display)',
                    height: '0.98em',
                    marginTop: 'calc(var(--schedule-display) * -6 / 285)',
                    marginLeft: 'calc(var(--schedule-display) * -10 / 285)',
                  }}
                >
                  {sessionCode(title)}
                </span>

                <div className="col-span-2 mt-[1.3rem] grid grid-cols-2 gap-x-[var(--g)] gap-y-[1.2rem] border-t border-border/70 pt-[1.3rem] text-[13px] font-bold uppercase leading-none tracking-[0.01em] md:grid-cols-[6fr_3fr_2fr_1fr] md:gap-y-0">
                  <span className="min-w-0">
                    <span className="mr-2 inline-block text-[8px] leading-none tracking-[0.01em]">
                      Session
                    </span>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="mr-2 inline-block text-[8px] leading-none tracking-[0.01em]">
                      Name:
                    </span>
                    {title}
                  </span>
                  <span className="hidden min-w-0 md:block">
                    <span className="mr-2 inline-block text-[8px] leading-none tracking-[0.01em]">
                      Time:
                    </span>
                    {start} - {end}
                  </span>
                  <span className="hidden text-right md:block">
                    <span className="mr-2 inline-block text-[8px] leading-none tracking-[0.01em]">
                      Length:
                    </span>
                    {minutes === null ? end : `${minutes} min`}
                  </span>
                </div>

                {/* Screen readers get the sentence the display type replaces. */}
                <p className="sr-only">{detail}</p>
              </button>
            </li>
          )
        })}
      </ol>

      {open && (
        <ScheduleModal
          session={SCHEDULE[open.index]}
          index={open.index}
          originRect={open.rect}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}

export function EventSchedule() {
  const root = useRef<HTMLElement>(null)
  const wave = useRef<HTMLDivElement>(null)
  const { setTheme } = useTheme()

  useGSAP(
    () => {
      if (!root.current || !wave.current) return
      gsap.registerPlugin(ScrollTrigger)

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.15,
        onUpdate: (self) => {
          const progress = self.progress
          wave.current?.style.setProperty('opacity', progress > 0 ? '1' : '0')
          wave.current?.style.setProperty('clip-path', getWavePolygon(progress, 0.5))
          // The sheet under the dock is dark from its first pixel, so the dock
          // has to be dark with it - the global theme only flips at 0.8, by which
          // point the light page above would go dark as well.
          if (progress > 0) setDockTheme('dark')
          if (progress >= 0.8) setTheme('dark')
          if (progress < 0.8) setTheme('light')
        },
        onLeave: () => {
          if (wave.current) wave.current.style.display = 'none'
          setTheme('dark')
        },
        onEnterBack: () => {
          if (wave.current) wave.current.style.display = 'block'
        },
        onLeaveBack: () => setTheme('light'),
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="schedule"
      aria-labelledby="schedule-title"
      /* z-30 clears the roadmap's z-20 timeline dots, so the wave covers them. */
      className="relative z-30 scroll-mt-16"
    >
      <div
        ref={wave}
        id="embedthon-wave-schedule"
        aria-hidden="true"
        className="dark pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background text-foreground"
        style={{ clipPath: 'polygon(0% 105%, 100% 105%, 100% 105%, 0% 105%)', opacity: 0 }}
      />

      <div className="dark relative z-10 bg-background text-foreground">
        {/* Full-bleed: the row type is sized against the page width, not a
            content column, so the list keeps the reference's 20px gutter. */}
        <div className="w-full px-5 py-20 sm:py-28">
          <div className="max-w-2xl">
            <h2
              id="schedule-title"
              className="text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl"
            >
              The day, in motion
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground/65 sm:text-lg">
              One day for showing work, sharing ideas, and meeting the people building next.
            </p>
          </div>

          <ScheduleTimeline />
        </div>
      </div>
    </section>
  )
}
