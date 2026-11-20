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
  const registrationHref = details.registrationUrl
  const { setTheme } = useTheme()

  // The document stays dark from here down to the venue: the hero is transparent
  // over the fixed board, and every light section brings its own palette instead
  // of the page flipping theme while it scrolls. Set unconditionally, so a reload
  // at any scroll position still starts from a dark document.
  useEffect(() => {
    setTheme('dark')
  }, [setTheme])

  const pad = (value: number) => String(value).padStart(2, '0')

  // The flowing corner lines carry the event's own copy rather than new prose.
  const marqueeText = `${details.name} - ${details.date} - ${details.location} - ${details.label} - ${details.tagline}`

  return (
    <section
      ref={root}
      id="embedthon-hero"
      // Sticky and behind the page's other content: the brief rises over it
      // instead of the hero scrolling away, and BriefCrest dims and finally
      // hides it once it is covered.
      className="dark sticky top-0 -z-10 flex min-h-svh flex-col justify-between overflow-hidden text-foreground"
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
      <div className="relative mx-auto flex w-full max-w-[1536px] flex-1 flex-col justify-center px-4 pt-8 pb-28 sm:px-8 sm:py-14 lg:px-10 xl:px-12">
        {/* Middle row: Embers '26 title & Date/Countdown */}
        <div className="grid items-center gap-5 lg:grid-cols-12 lg:gap-8">
          {/* Middle-Left: Title & Category Sub-banner */}
          <div className="relative isolate lg:col-span-9 flex flex-col -ml-1 sm:-ml-2 lg:-ml-3">
            {/*
              The Embers mark, large and faint behind the title. It is a
              transparent WebP made from the traced logo (the 5 MB SVG is not
              shipped), with its near-black lettering lifted a little. A thin
              copper rim keeps the E's outline readable on the dark hero.
              Decorative: the title already names the event.
            */}
            <Image
              src="/embersLogoBackdrop.webp"
              alt=""
              width={1280}
              height={1326}
              priority
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[min(14.5rem,62%)] -translate-x-1/2 -translate-y-1/2 select-none opacity-60 [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_8px_hsl(var(--primary)/0.3))] lg:left-[34%] lg:w-[24rem]"
            />

            <div className="mb-3 flex items-center gap-2.5 pl-1">
              {/* The club's own mark; the label beside it names the club, hence the empty alt. */}
              <Image
                src="/embedClubLogo-Dark.svg"
                alt=""
                width={48}
                height={48}
                unoptimized
                className="size-10 shrink-0 sm:size-12"
              />
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
              <p className="hidden text-[clamp(2.8rem,5.2vw,4.6rem)] font-extrabold leading-none text-primary tracking-tight lg:block">
                {event === 'embers' ? '25' : '24 - 25'}
              </p>
              {/* Phones: the date and time on one line of their own. */}
              <p className="text-[15px] font-semibold text-foreground/85 lg:hidden">
                {details.date}
                <span className="font-normal text-foreground/55"> &bull; {details.time}</span>
              </p>
              <p className="mt-2 hidden text-base font-semibold text-foreground/85 lg:block">
                {details.date}
              </p>
              <p className="mt-1 hidden text-sm text-foreground/50 lg:block">
                {details.day} &bull; {details.time}
              </p>

              {/* Countdown timer */}
              <div className="mt-4 lg:mt-5 lg:pt-4">
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
        <div className="mt-6 sm:mt-14 sm:pt-8 lg:mt-16">
          <div className="mx-auto flex max-w-[840px] flex-col items-center text-center">
            <p className="text-[clamp(0.95rem,1.5vw,1.25rem)] font-medium leading-[1.55] text-foreground/90">
              {details.description}
            </p>

            <div className="mt-5 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
              <a
                href={registrationHref}
                target="_blank"
                rel="noopener noreferrer"
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
