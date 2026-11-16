'use client'

import { useEffect, useRef } from 'react'
import { SectionHeading } from './sectionHeading'

const STATIONS = [
  {
    title: 'Register & Submit',
    detail:
      'Form your squad (2 to 4 for Project Expo, 1 to 3 for Paper Presentation), pick your domain, and submit your project synopsis or paper abstract online.',
  },
  {
    title: 'Review & Shortlist',
    detail:
      'Submissions undergo technical evaluation by the CSE faculty committee. Shortlisted squads receive official entry confirmations and stall allocations.',
  },
  {
    title: 'Setup & Exhibit',
    detail:
      'Report to the PACE campus on 25 November. Set up your hardware prototype at the Project Expo stalls or prepare your slide deck in the Paper Presentation hall.',
  },
  {
    title: 'Jury Defense & Live Demo',
    detail:
      'Demonstrate working builds to academic and IEEE evaluators. Walk the judges through your code, circuit schematic, methodology, and innovation.',
  },
  {
    title: 'Awards & Cash Prizes',
    detail:
      'Top-performing teams across both tracks are awarded exciting cash prizes, winner trophies, and certificates of merit at the valedictory ceremony.',
  },
]

export function AgentLoop() {
  const listRef = useRef<HTMLOListElement>(null)
  const railTrackRef = useRef<HTMLDivElement>(null)
  const railBarRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const nodeFillRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepNumberRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const list = listRef.current
    const railTrack = railTrackRef.current
    const railBar = railBarRef.current
    if (!list || !railTrack || !railBar) return

    const calculateFill = () => {
      const firstNode = nodeRefs.current[0]
      const lastNode = nodeRefs.current[nodeRefs.current.length - 1]
      if (!firstNode || !lastNode) return

      const firstRect = firstNode.getBoundingClientRect()
      const lastRect = lastNode.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()

      // Position rail track between center of first node and center of last node
      const topOffset = firstRect.top - listRect.top + firstRect.height / 2
      const bottomOffset = listRect.bottom - (lastRect.top + lastRect.height / 2)
      const totalBarHeight = listRect.height - topOffset - bottomOffset

      railTrack.style.top = `${topOffset}px`
      railTrack.style.height = `${Math.max(0, totalBarHeight)}px`

      // Measure scroll progression
      const viewportCenter = window.innerHeight * 0.55
      const scrolled = viewportCenter - (firstRect.top + firstRect.height / 2)
      const progress = totalBarHeight > 0 ? Math.max(0, Math.min(1, scrolled / totalBarHeight)) : 0

      // Update copper bar height directly
      const currentBarHeight = progress * totalBarHeight
      railBar.style.height = `${currentBarHeight}px`

      const barBottomPosition = firstRect.top + firstRect.height / 2 + currentBarHeight
      const fillDistance = 48

      nodeRefs.current.forEach((node, index) => {
        const fillEl = nodeFillRefs.current[index]
        const numEl = stepNumberRefs.current[index]
        if (!node || !fillEl) return

        const nodeRect = node.getBoundingClientRect()
        const nodeCenterY = nodeRect.top + nodeRect.height / 2
        const distanceToNode = nodeCenterY - barBottomPosition

        let fillLevel = 0
        if (distanceToNode <= 0) {
          fillLevel = 1
        } else if (distanceToNode <= fillDistance) {
          fillLevel = 1 - distanceToNode / fillDistance
        }

        fillEl.style.clipPath = `inset(${(1 - fillLevel) * 100}% 0 0 0)`

        if (numEl) {
          if (fillLevel >= 0.95) {
            numEl.style.color = 'hsl(var(--primary))'
            numEl.style.fontWeight = '700'
          } else {
            numEl.style.color = ''
            numEl.style.fontWeight = ''
          }
        }
      })
    }

    calculateFill()
    window.addEventListener('scroll', calculateFill, { passive: true })
    window.addEventListener('resize', calculateFill, { passive: true })

    return () => {
      window.removeEventListener('scroll', calculateFill)
      window.removeEventListener('resize', calculateFill)
    }
  }, [])

  return (
    <section id="roadmap" aria-labelledby="loop-title" className="relative scroll-mt-16">
      <div className="mx-auto grid w-full max-w-[1320px] gap-14 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-12 lg:gap-16 lg:px-14">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              id="loop-title"
              title="The competition roadmap"
              deck="From abstract submission to the live jury stage. Whether you bring a working embedded prototype to the Project Expo or defend original research in Paper Presentation, here is the journey to the podium."
              className="mb-0"
            />
          </div>
        </div>

        <div className="relative lg:col-span-8">
          {/* Stepper timeline rail: outlined copper capsule with filling bar */}
          <div
            ref={railTrackRef}
            aria-hidden="true"
            className="absolute left-[14px] -translate-x-1/2 w-3 pointer-events-none rounded-full border-2 border-primary/40 bg-transparent"
          >
            <div
              ref={railBarRef}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[8px] bg-primary rounded-full origin-top"
              style={{ height: '0px' }}
            />
          </div>

          <ol ref={listRef} className="relative">
            {STATIONS.map((station, index) => (
              <li
                key={station.title}
                className="relative pb-14 pl-14 last:pb-2 transition-all duration-300"
              >
                {/* Stepper timeline node: outer ring + inner copper fill */}
                <div
                  ref={(el) => {
                    nodeRefs.current[index] = el
                  }}
                  aria-hidden="true"
                  className="absolute left-[14px] top-1.5 h-7 w-7 -translate-x-1/2 z-20 pointer-events-none"
                >
                  {/* Outer border */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/40 bg-background" />

                  {/* Progressive copper fill circle */}
                  <div
                    ref={(el) => {
                      nodeFillRefs.current[index] = el
                    }}
                    className="absolute inset-0 rounded-full border-2 border-primary bg-primary transition-transform duration-100"
                    style={{ clipPath: 'inset(100% 0 0 0)' }}
                  />
                </div>

                <div className="flex items-baseline gap-3">
                  <span
                    ref={(el) => {
                      stepNumberRefs.current[index] = el
                    }}
                    className="text-xs tabular-nums text-foreground/40 transition-colors duration-200"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-2xl font-extrabold uppercase leading-none tracking-[-0.02em] text-foreground sm:text-3xl">
                    {station.title}
                  </h3>
                </div>
                <p className="mt-3 max-w-[56ch] text-[15px] leading-[1.7] text-foreground/65">
                  {station.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
