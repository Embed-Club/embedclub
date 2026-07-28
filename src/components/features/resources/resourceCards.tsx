'use client'

import type { ResourceCardData } from '@/app/(frontend)/resources/resourcesPageContent'
import { ResourceCutoutCard } from '@/components/features/resources/resourceCutoutCard'
import { gsap } from 'gsap'
import { useCallback, useEffect, useRef } from 'react'

interface ResourceCardsProps {
  resources: ResourceCardData[]
  /** Route prefix each card links to — `/resources` or `/tutorials`. */
  basePath?: string
}

export function ResourceCards({ resources, basePath = '/resources' }: ResourceCardsProps) {
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

          gsap.fromTo(
            el,
            {
              opacity: 0,
              y: 48,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
              delay: index * 0.05,
            },
          )

          observer.unobserve(el)
        }
      },
      { threshold: 0.2 },
    )

    for (const el of elements) {
      observer.observe(el)
    }

    // Mention resources to ensure effect re-runs when props change, as we need to re-observe elements
    const _trigger = resources.length

    return () => {
      observer.disconnect()
      cardRefs.current.clear()
    }
  }, [resources])

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
        {resources.map((resource, index) => (
          <div
            key={resource.id}
            data-index={index}
            ref={(el) => setCardRef(resource.id, el)}
            className="w-full"
          >
            <ResourceCutoutCard card={resource} basePath={basePath} />
          </div>
        ))}
      </div>
    </div>
  )
}
