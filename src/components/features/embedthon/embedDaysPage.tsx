'use client'

import { animate, motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const EVENTS = [
  {
    href: '/embedthon',
    title: 'Embedthon',
    detail: 'Agentic AI workshop and 24-hour hackathon',
    date: '24 - 25 November 2026',
    audience: 'For 2nd year CSE students',
    direction: -1,
  },
  {
    href: '/embers',
    title: "Embers '26",
    detail: 'National level technical fest',
    date: '25 November 2026',
    audience: 'Open to student innovators',
    direction: 1,
  },
] as const

const TRANSITION_DURATION = 0.65
const TRANSITION_DURATION_MS = TRANSITION_DURATION * 1000
const TRANSITION_EASE = [0.65, 0, 0.35, 1] as const

export function EmbedDaysPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [direction, setDirection] = useState<-1 | 1 | null>(null)

  useEffect(() => {
    router.prefetch('/embedthon')
    router.prefetch('/embers')
  }, [router])

  const chooseEvent = (href: string, nextDirection: -1 | 1) => {
    if (direction) return

    if (reduceMotion) {
      router.push(href)
      return
    }

    const shell = document.querySelector<HTMLElement>('.group\\/sidebar-wrapper')
    if (shell) {
      animate(
        shell,
        { x: nextDirection * window.innerWidth },
        { duration: TRANSITION_DURATION, ease: TRANSITION_EASE },
      )
    }

    setDirection(nextDirection)
    window.setTimeout(() => router.push(href), TRANSITION_DURATION_MS)
  }

  return (
    <>
      <main className="flex min-h-full w-full flex-col px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
          <div className="mb-8 max-w-2xl sm:mb-12">
            <h1 className="text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              Embed Days
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground/65 sm:text-lg">
              Pick your side. Build with AI, or bring your best work to the national stage.
            </p>
          </div>

          <div className="grid min-h-0 gap-3 md:grid-cols-2 md:gap-5">
            {EVENTS.map((event) => (
              <button
                key={event.href}
                type="button"
                onClick={() => chooseEvent(event.href, event.direction)}
                disabled={direction !== null}
                className="group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/70 p-6 text-left transition-[border-color,transform,background-color,opacity] duration-300 hover:-translate-y-1 hover:border-primary hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-64 sm:p-8"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 texture-panel"
                />
                <div className="relative">
                  <p className="text-sm font-semibold text-primary">{event.date}</p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">
                    {event.title}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/70 sm:text-base">
                    {event.detail}
                  </p>
                </div>
                <div className="relative mt-6 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
                  <span className="text-foreground/55">{event.audience}</span>
                  <span className="font-bold text-primary">Enter</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {direction &&
        createPortal(
          <motion.div
            key={direction}
            aria-hidden="true"
            initial={{ x: `${-direction * 100}%` }}
            animate={{ x: '0%' }}
            transition={{ duration: TRANSITION_DURATION, ease: TRANSITION_EASE }}
            className="pointer-events-none fixed inset-0 z-[10000] bg-primary"
          />,
          document.body,
        )}
    </>
  )
}
