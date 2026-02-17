import { useEffect, useState, RefObject } from 'react'
import { useScroll, useMotionValue } from 'motion/react'

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

export function useTimelineScroll(containerRef: RefObject<HTMLDivElement>) {
  const isMobile = useDeviceType()

  // Desktop: scroll within container
  const { scrollYProgress: desktopScrollProgress } = useScroll({
    container: isMobile ? undefined : containerRef,
  })

  // Mobile: track global window scroll position
  const mobileScrollProgress = useMotionValue(0)

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
      mobileScrollProgress.set(progress)
    }

    handleScroll() // Initial calculation
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isMobile, mobileScrollProgress])

  const scrollYProgress = isMobile ? mobileScrollProgress : desktopScrollProgress

  return { scrollYProgress, isMobile }
}