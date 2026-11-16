'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from 'next-themes'
import { useRef } from 'react'
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

function ScheduleTimeline() {
  return (
    <div className="mt-14 border-y border-border/80">
      {SCHEDULE.map(([start, end, title, detail], index) => (
        <article
          key={title}
          className="group relative grid min-h-52 overflow-hidden border-b border-border/80 last:border-b-0 md:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]"
        >
          <p className="pointer-events-none absolute -left-1 top-2 font-extrabold leading-none tracking-[-0.08em] text-foreground/[0.08] text-[clamp(5rem,15vw,13rem)]">
            {start}
          </p>
          <div className="relative z-10 flex items-end p-5 sm:p-8">
            <span className="text-sm font-bold tabular-nums text-primary">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="relative z-10 flex flex-col justify-end border-t border-border/60 p-5 sm:border-l sm:border-t-0 sm:p-8">
            <p className="text-sm font-semibold tabular-nums text-primary">
              {start} - {end}
            </p>
            <h3 className="mt-2 max-w-xl text-2xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {title}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/65 sm:text-base">
              {detail}
            </p>
          </div>
        </article>
      ))}
    </div>
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
      className="relative scroll-mt-16"
    >
      <div
        ref={wave}
        aria-hidden="true"
        className="dark pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background text-foreground"
        style={{ clipPath: 'polygon(0% 105%, 100% 105%, 100% 105%, 0% 105%)', opacity: 0 }}
      />

      <div className="dark relative z-10 bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1536px] px-5 py-20 sm:px-10 sm:py-28 lg:px-14">
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
