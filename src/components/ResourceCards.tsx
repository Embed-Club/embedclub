'use client'

import type { ResourceCardData } from '@/app/(frontend)/resources/ResourcesPageContent'
import { ResourceCard } from '@/components/ResourceCard'
import { gsap } from 'gsap'
import { useCallback, useEffect, useRef } from 'react'

interface ResourceCardsProps {
  resources: ResourceCardData[]
}

export function ResourceCards({ resources }: ResourceCardsProps) {
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

    elements.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 0 })
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const el = entry.target as HTMLDivElement
          const indexAttr = el.getAttribute('data-index')
          const index = indexAttr ? Number(indexAttr) : 0

          const startY = window.innerHeight + 200

          gsap.fromTo(
            el,
            {
              opacity: 0,
              y: startY,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.in',
              delay: index * 0.05,
            },
          )

          observer.unobserve(el)
        })
      },
      { threshold: 0.2 },
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      cardRefs.current.clear()
    }
  }, [resources])

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 w-full">
        {resources.map((resource, index) => (
          <div
            key={resource.id}
            data-index={index}
            ref={(el) => setCardRef(resource.id, el)}
            className="w-full"
          >
            <ResourceCard card={resource} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
