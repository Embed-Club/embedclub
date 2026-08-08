import { ScrollContainerContext } from '@/components/layout/scrollContainerContext'
import { useMotionValue } from 'motion/react'
import { type RefObject, useContext, useEffect, useState } from 'react'

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }

    checkMobile()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}

/** Tracks scroll progress of `targetRef` against the page's single scroll
 *  owner (the layout's `[data-scroll-container]` panel, shared via
 *  ScrollContainerContext) — 0 when the target's top edge reaches the
 *  container's top, 1 when the target's bottom edge does. Measured via
 *  getBoundingClientRect (viewport-relative) rather than the container's
 *  scrollTop/scrollHeight ratio, so trailing siblings after the target
 *  (e.g. the site footer) don't dilute the range — matches the old private
 *  scroll-box behaviour where the container's extent WAS the target's. */
export function useTimelineScroll(targetRef: RefObject<HTMLElement | null>) {
  const isMobile = useDeviceType()
  const scrollContainer = useContext(ScrollContainerContext)
  const scrollYProgress = useMotionValue(0)

  useEffect(() => {
    if (!scrollContainer) return

    const handleScroll = () => {
      const target = targetRef.current
      if (!target) return

      const containerRect = scrollContainer.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const scrollableRange = targetRect.height - containerRect.height
      const scrolledIntoTarget = containerRect.top - targetRect.top
      const progress =
        scrollableRange > 0 ? Math.min(1, Math.max(0, scrolledIntoTarget / scrollableRange)) : 0
      scrollYProgress.set(progress)
    }

    handleScroll()
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [scrollContainer, scrollYProgress, targetRef])

  return { scrollYProgress, isMobile }
}
