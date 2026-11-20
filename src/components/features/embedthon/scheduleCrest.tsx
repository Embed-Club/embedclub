'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { MAX_SIGMA, MIN_SIGMA, crestPolygon, smoothstep } from './briefCrest'

/**
 * The hand-off from the light roadmap to the dark schedule, built the way the
 * hand-off from the hero to the brief is (`BriefCrest`).
 *
 * The roadmap is pinned with its bottom edge on the bottom of the screen once you
 * have read it (see `AgentLoop`), and the schedule rises over it. This crest is the
 * schedule's own top edge: it carries the same dark fill as the schedule, so there is
 * no seam, and it is scrubbed from a full dome to a flat edge across the rise. The
 * roadmap's bottom padding is exactly this crest's height (`--crest-h`, set on
 * `main`), so the dome rises over empty cream and never over a step's text.
 *
 * It is a plain scrubbed element, not a fixed full-screen sheet kept in step with the
 * scroll, which is what used to leave a hard seam and a dome stranded mid-screen on
 * phones. It does not touch the document theme, and once the schedule has fully
 * covered the roadmap the roadmap stops being painted.
 */
export function ScheduleCrest() {
  const crestRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const crest = crestRef.current
      const section = crest?.closest('section')
      if (!crest || !section) return

      gsap.registerPlugin(ScrollTrigger)
      const roadmap = document.getElementById('roadmap')
      let sigma = MIN_SIGMA

      // Keep the slope the same on every screen: width follows height, so a tall
      // crest on a narrow phone is a mound and not a spike.
      const measure = () => {
        const { offsetWidth: width, offsetHeight: height } = crest
        if (!width) return
        sigma = Math.min(MAX_SIGMA, Math.max(MIN_SIGMA, (1.4 * height) / width))
      }

      const paint = (progress: number) => {
        crest.style.clipPath = crestPolygon(1 - smoothstep(0.18, 0.92, progress), sigma)
        if (roadmap) roadmap.style.visibility = progress >= 1 ? 'hidden' : 'visible'
      }

      ScrollTrigger.create({
        trigger: section,
        // Start when the dome's apex reaches the bottom of the screen.
        start: () => `top bottom+=${crest.offsetHeight}`,
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          measure()
          paint(self.progress)
        },
        onUpdate: (self) => paint(self.progress),
      })
    },
    { scope: crestRef },
  )

  return (
    <div
      ref={crestRef}
      id="embedthon-schedule-crest"
      aria-hidden="true"
      // One pixel of overlap with the section, so antialiasing cannot leave a seam.
      className="dark pointer-events-none absolute inset-x-0 bottom-[calc(100%-1px)] h-[var(--crest-h)] bg-background"
      style={{ clipPath: crestPolygon(1), willChange: 'clip-path' }}
    />
  )
}
