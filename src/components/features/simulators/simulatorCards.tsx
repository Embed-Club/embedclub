'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'
import { SimulatorCard } from '@/components/features/simulators/simulatorCard'
import { motion, useReducedMotion } from 'motion/react'

interface SimulatorCardsProps {
  simulators: SimulatorCardData[]
  onOpen: (card: SimulatorCardData) => void
}

/**
 * Reveal-on-scroll via `motion`'s `whileInView`, the same mechanism
 * `masonry.tsx` uses — not gsap + a hand-rolled IntersectionObserver, which
 * shipped a second full animation library just for this one effect and
 * (unlike this version) ignored `prefers-reduced-motion`.
 */
export function SimulatorCards({ simulators, onOpen }: SimulatorCardsProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="w-full">
      {/* Same column rhythm as the resources grid — one card system, one layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
        {simulators.map((simulator, index) => (
          <motion.div
            key={simulator.id}
            className="w-full"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (index % 8) * 0.05 }}
          >
            <SimulatorCard card={simulator} onOpen={onOpen} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
