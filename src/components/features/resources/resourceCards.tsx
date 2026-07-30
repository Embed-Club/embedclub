'use client'

import type { ResourceCardData } from '@/app/(frontend)/resources/resourcesPageContent'
import { ResourceCutoutCard } from '@/components/features/resources/resourceCutoutCard'
import { motion, useReducedMotion } from 'motion/react'

interface ResourceCardsProps {
  resources: ResourceCardData[]
  /** Route prefix each card links to — `/resources` or `/tutorials`. */
  basePath?: string
}

/**
 * Reveal-on-scroll via `motion`'s `whileInView`, the same mechanism
 * `masonry.tsx` uses — not gsap + a hand-rolled IntersectionObserver, which
 * shipped a second full animation library just for this one effect and
 * (unlike this version) ignored `prefers-reduced-motion`.
 */
export function ResourceCards({ resources, basePath = '/resources' }: ResourceCardsProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            className="w-full"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -40px 0px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 8) * 0.05 }}
          >
            <ResourceCutoutCard card={resource} basePath={basePath} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
