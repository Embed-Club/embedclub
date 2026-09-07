'use client'

import { measureReadingProgress } from '@/lib/readingProgress'
import { useEffect, useRef } from 'react'

/**
 * Reading progress for the phone and tablet layouts, where the sticky
 * table-of-contents rail (and the progress bar inside it) is hidden below `lg`.
 * On an 18,000px tutorial that left no sense of position at all.
 *
 * It sits on the seam between the fixed mobile header and the scrolling panel -
 * the panel's own `pt-16` clearance - so it reads as the header's underline
 * rather than as a stripe floating over the article, and doubles as the edge
 * the transparent header otherwise lacks.
 *
 * Driven straight from the scroll handler with a transform, for the same reason
 * the desktop rail writes its own width: routing a per-frame value through
 * `setState` re-renders on a task the browser defers mid-gesture, and the bar
 * visibly stalls then snaps. `scaleX` also keeps it off the layout path.
 *
 * `aria-hidden`: it reports position, not content. A progressbar role here
 * would announce a new percentage on every frame of a scroll.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = document.querySelector('[data-scroll-container]')
    if (!scroller) return

    const measure = () => {
      const progress = measureReadingProgress()
      if (progress == null || !barRef.current) return
      barRef.current.style.transform = `scaleX(${progress})`
    }

    // rAF-throttled: scroll fires far more often than we can usefully paint.
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-[3px] bg-border/60 lg:hidden"
    >
      <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-primary" />
    </div>
  )
}
