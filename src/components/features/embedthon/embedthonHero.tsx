'use client'

import { EmbedthonTextBuildUp } from '@/components/features/embedthon/embedthonTextBuildUp'
import { WisprFlowTextAnimation } from '@/components/features/embedthon/wisprFlowTextAnimation'
import { useEventCountdown } from '@/hooks/useEventCountdown'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { type EventType, eventDetails } from './eventType'

const UNITS: { key: 'days' | 'hours' | 'minutes' | 'seconds'; label: string }[] = [
  { key: 'days', label: 'days' },
  { key: 'hours', label: 'hrs' },
  { key: 'minutes', label: 'min' },
  { key: 'seconds', label: 'sec' },
]

export function EmbedthonHero({ event }: { event: EventType }) {
  const root = useRef<HTMLElement>(null)
  const details = eventDetails[event]
  const left = useEventCountdown(details.start)
  const registrationHref =
    event === 'embedthon' ? 'https://forms.gle/B6RdZZhG5mFa34sJA' : '#register'
  const { setTheme } = useTheme()

  // On mount, if scrolled near top, ensure dark theme for Hero
  useEffect(() => {
    if (window.scrollY < window.innerHeight * 0.4) {
      setTheme('dark')
    }
  }, [setTheme])

  const pad = (value: number) => String(value).padStart(2, '0')

  // The flowing corner lines carry the event's own copy rather than new prose.
  const marqueeText = `${details.name} - ${details.date} - ${details.location} - ${details.label} - ${details.tagline}`

  return (
    <section
      ref={root}
      className="dark relative flex min-h-svh flex-col justify-between overflow-hidden text-foreground"
    >
      {/* Corner marquees sit outside the padded content column so they reach the
          page edges; the line runs off the viewport corner instead of floating. */}
      <WisprFlowTextAnimation
        text={marqueeText}
        corner="topRight"
        className="pointer-events-none absolute right-0 top-0 hidden w-[24rem] md:block"
      />
      <WisprFlowTextAnimation
        text={marqueeText}
        corner="bottomLeft"
        className="pointer-events-none absolute bottom-0 left-0 hidden w-[22rem] md:block"
      />

      {/* Main hero content */}
      <div className="relative mx-auto flex w-full max-w-[1536px] flex-1 flex-col justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-10 xl:px-12">
        {/* Middle row: Embers '26 title & Date/Countdown */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-8">
          {/* Middle-Left: Title & Category Sub-banner */}
          <div className="lg:col-span-9 flex flex-col -ml-1 sm:-ml-2 lg:-ml-3">
            <div className="mb-3 flex items-center gap-2.5 pl-1">
              {/*
                The club mark is an illustration - near-black lettering with a
                copper flame - so it needs its own light plate to sit on the
                dark hero. The label beside it already names the club, hence the
                empty alt.
              */}
              <span className="light flex size-10 shrink-0 items-center justify-center rounded-lg bg-background p-0.5 shadow-sm sm:size-12">
                <Image
                  src="/embersLogoMark.webp"
                  alt=""
                  width={768}
                  height={796}
                  priority
                  className="size-full object-contain"
                />
              </span>
              <span className="text-sm font-semibold text-foreground/70">Embed Club presents</span>
            </div>
            <EmbedthonTextBuildUp className="w-full" event={event} />
            <div className="mt-3 flex flex-wrap items-center gap-3 pl-1">
              <span className="inline-block rounded-sm bg-primary/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
                {details.label}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                {details.tagline}
              </span>
            </div>
          </div>

          {/* Middle-Right: Date and Countdown timer */}
          <div className="lg:col-span-3 lg:self-start lg:pt-1">
            <div className="flex flex-col">
              <p className="text-[clamp(2.8rem,5.2vw,4.6rem)] font-extrabold leading-none text-primary tracking-tight">
                {event === 'embers' ? '25' : '24 - 25'}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground/85">{details.date}</p>
              <p className="mt-1 text-sm text-foreground/50">
                {details.day} &bull; {details.time}
              </p>

              {/* Countdown timer */}
              <div className="mt-5 pt-4">
                <p className="text-xs uppercase tracking-wider text-foreground/45">
                  Fest begins in
                </p>
                <div className="mt-2 flex items-start gap-4">
                  {UNITS.map((unit) => (
                    <div key={unit.key}>
                      <span className="block text-[clamp(1.4rem,2.2vw,1.9rem)] font-extrabold leading-none tabular-nums text-foreground">
                        {pad(left[unit.key])}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase text-foreground/40">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-foreground/45">{details.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Below Middle: Description & Action Buttons */}
        <div className="mt-10 sm:mt-14 lg:mt-16 pt-6 sm:pt-8">
          <div className="mx-auto flex max-w-[840px] flex-col items-center text-center">
            <p className="text-[clamp(1.05rem,1.5vw,1.25rem)] font-medium leading-[1.6] text-foreground/90">
              {details.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <a
                href={registrationHref}
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 text-[15px] font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {details.registerLabel}
              </a>
              <a
                href="#tracks"
                className="inline-flex min-h-12 items-center justify-center rounded-sm border border-border bg-card/40 px-8 text-[15px] font-semibold text-foreground transition-all hover:border-primary/60 hover:text-primary hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {details.tracksLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
