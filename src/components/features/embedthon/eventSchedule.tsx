'use client'

import { type CSSProperties, useRef, useState } from 'react'
import { ScheduleCrest } from './scheduleCrest'

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
 * The day's sessions as display type. At rest a row is dark: its number and a
 * two-letter code, dimmed. Point at it and the dark splits along the middle and
 * pulls away to the top and the bottom, and a light bar opens in its place with the
 * full session name on the left at display size and the time on the right. Nothing
 * opens over the list and no row changes height, so the whole day stays in view.
 *
 * A mouse reveals a row by hovering it and a keyboard by focusing it. A finger has
 * no hover, so a tap reveals a row and a second tap puts it away. Only one row is
 * ever revealed at a time.
 */
function ScheduleTimeline() {
  const [active, setActive] = useState<number | null>(null)
  // A click that follows a hover is not a tap: the row is already revealed, and
  // toggling it would put it away the moment you pressed it.
  const touched = useRef(false)

  return (
    <ol
      className="mt-14 border-t border-border/70"
      style={{ '--schedule-display': 'clamp(56px, 21vw, 285px)' } as CSSProperties}
    >
      {SCHEDULE.map(([start, end, title, detail], index) => {
        const minutes = slotMinutes(start, end)
        const isActive = active === index
        const length = minutes === null ? end : `${minutes} min`
        const rowStyle = {
          fontSize: 'var(--schedule-display)',
          height: '0.98em',
          marginTop: 'calc(var(--schedule-display) * -6 / 285)',
        } as CSSProperties

        return (
          <li key={title} className="border-t border-border/70 first:border-t-0">
            <button
              type="button"
              data-active={isActive}
              aria-expanded={isActive}
              onPointerDown={(event) => {
                touched.current = event.pointerType !== 'mouse'
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setActive(index)
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse')
                  setActive((current) => (current === index ? null : current))
              }}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) setActive(index)
              }}
              onBlur={() => setActive((current) => (current === index ? null : current))}
              onClick={() => {
                if (touched.current) setActive((current) => (current === index ? null : index))
              }}
              className="group relative grid w-full grid-cols-2 gap-x-[var(--g)] gap-y-0 overflow-clip pb-[1.3rem] text-left text-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="block font-bold leading-[0.98] tracking-[-0.01em] transition-opacity duration-200 group-data-[active=true]:opacity-0"
                style={{
                  ...rowStyle,
                  marginLeft: 'calc(var(--schedule-display) * -9 / 285)',
                }}
              >
                {`S.${String(index + 1).padStart(2, '0')}`}
              </span>

              <span
                aria-hidden="true"
                className="block justify-self-start font-bold leading-[0.98] tracking-[-0.01em] transition-opacity duration-200 group-data-[active=true]:opacity-0"
                style={{
                  ...rowStyle,
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
                  {length}
                </span>
              </div>

              {/* The light bar. Clipped to a hairline along the row's middle at rest;
                  on reveal the clip opens to the full row, which reads as the dark
                  splitting and sliding away top and bottom. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-between gap-[var(--g)] bg-foreground px-[20px] text-background transition-[clip-path] duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] [clip-path:inset(50%_0_50%_0)] group-data-[active=true]:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none"
              >
                <span className="max-w-[72%] text-[clamp(26px,6.4vw,120px)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] opacity-0 transition-opacity delay-200 duration-300 group-data-[active=true]:opacity-100 motion-reduce:transition-none">
                  {title}
                </span>
                <span className="shrink-0 text-right opacity-0 transition-opacity delay-200 duration-300 group-data-[active=true]:opacity-100 motion-reduce:transition-none">
                  <span className="block text-[clamp(18px,3.6vw,70px)] font-extrabold leading-none tabular-nums tracking-[-0.02em]">
                    {start} - {end}
                  </span>
                  <span className="mt-[0.4em] block text-[clamp(12px,1.5vw,28px)] font-bold leading-none text-background/60">
                    {length}
                  </span>
                </span>
              </span>

              {/* Screen readers get the sentence the display type replaces. */}
              <p className="sr-only">{detail}</p>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function EventSchedule() {
  return (
    <section id="schedule" aria-labelledby="schedule-title" className="relative z-30 scroll-mt-16">
      {/* The dome the day rises over the roadmap on (see ScheduleCrest). */}
      <ScheduleCrest />

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
