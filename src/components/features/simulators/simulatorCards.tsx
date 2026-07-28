'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import { SimulatorCard } from '@/components/features/simulators/simulatorCard'
import { gsap } from 'gsap'
import { useCallback, useEffect, useRef } from 'react'

interface SimulatorCardsProps {
  simulators: SimulatorCardData[]
  onOpen: (card: SimulatorCardData) => void
}

export function SimulatorCards({ simulators, onOpen }: SimulatorCardsProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el)
    } else {
      cardRefs.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const elements = Array.from(cardRefs.current.values())

    for (const el of elements) {
      gsap.set(el, { opacity: 0, y: 0 })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const el = entry.target as HTMLDivElement
          const indexAttr = el.getAttribute('data-index')
          const index = indexAttr ? Number(indexAttr) : 0

          const startY = 100 // Subtle animation for simulators

          gsap.fromTo(
            el,
            {
              opacity: 0,
              y: startY,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              delay: index * 0.05,
            },
          )

          observer.unobserve(el)
        }
      },
      { threshold: 0.1 },
    )

    for (const el of elements) {
      observer.observe(el)
    }

    // Reference simulators so the effect re-runs (and re-observes) when the list changes
    const _retrigger = simulators.length

    return () => {
      observer.disconnect()
      cardRefs.current.clear()
    }
  }, [simulators])

  return (
    <div className="w-full">
      {/* Same column rhythm as the resources grid — one card system, one layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
        {simulators.map((simulator, index) => (
          <div
            key={simulator.id}
            data-index={index}
            ref={(el) => setCardRef(simulator.id, el)}
            className="w-full"
          >
            <SimulatorCard card={simulator} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  )
}
