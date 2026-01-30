'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { TimelineItem } from '@/components/TimelineItem'

interface Achievement {
  id: string
  title: string
  text: string
  image: string | null
}

interface ScrollTimelineProps {
  achievements: Achievement[]
}

export function ScrollTimeline({ achievements }: ScrollTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timelineBarRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const [nodeFillLevels, setNodeFillLevels] = useState<number[]>(
    new Array(achievements.length).fill(0),
  )

  const { scrollYProgress } = useScroll({
    container: containerRef,
  })

  // Calculate node fill based on white bar position
  useEffect(() => {
    const calculateFill = () => {
      if (!containerRef.current || !contentRef.current || !timelineBarRef.current) return

      const contentRect = contentRef.current.getBoundingClientRect()
      const contentTop = contentRect.top

      // Calculate the white bar's current height based on scroll progress
      const scrollProgress = scrollYProgress.get()
      const totalBarHeight = timelineBarRef.current.clientHeight
      const currentBarHeight = scrollProgress * totalBarHeight
      const barBottomPosition = contentTop + currentBarHeight

      // Calculate fill level for each node
      const fillLevels = nodeRefs.current.map((nodeRef) => {
        if (!nodeRef) return 0

        const nodeRect = nodeRef.getBoundingClientRect()
        const nodeCenterY = nodeRect.top + nodeRect.height / 2

        // Calculate distance from bar bottom to node center
        const distanceToNode = nodeCenterY - barBottomPosition

        // Start filling when bar is 100px before the node, complete when bar reaches node
        const fillDistance = 100 // pixels before node to start filling

        if (distanceToNode <= 0) {
          // Bar has passed the node
          return 1
        } else if (distanceToNode <= fillDistance) {
          // Bar is approaching the node
          return 1 - distanceToNode / fillDistance
        } else {
          // Bar hasn't reached fill distance yet
          return 0
        }
      })

      setNodeFillLevels(fillLevels)
    }

    const unsubscribe = scrollYProgress.on('change', calculateFill)

    // Initial calculation
    setTimeout(calculateFill, 100)

    return () => unsubscribe()
  }, [scrollYProgress, achievements])

  return (
    <div className="relative w-full h-full">
      {/* Fixed Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-8 bg-gradient-to-b from-background to-transparent pointer-events-none"></div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        data-timeline-scroll
        className="w-full h-full overflow-y-scroll overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
        }}
      >
        <div ref={contentRef} className="relative min-h-full pt-32 pb-32">
          {/* Timeline Heading */}
          <div className="relative mb-16 px-8">
            <h1 className="text-left text-xl font-medium md:text-4xl">
              CHIEEENTS
            </h1>
          </div>

          {/* Timeline Bar Container - Fixed positioning */}
          <div
            ref={timelineBarRef}
            className="absolute left-1/2 top-0 bottom-20 w-3 -translate-x-1/2 pointer-events-none"
          >
            {/* Outer border of the bar */}
            <div className="absolute top-0 bottom-0 w-full rounded-full border-2 border-foreground/40 dark:border-white/40 bg-transparent" />

            {/* Inner fill that animates */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[8px] bg-foreground dark:bg-white rounded-full origin-top"
              style={{
                height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']),
              }}
            />
          </div>

          {/* Achievement Items */}
          <div className="relative">
            {achievements.map((achievement, index) => {
              const isLeft = index % 2 === 0
              const nodeFillProgress = nodeFillLevels[index] || 0

              return (
                <div key={achievement.id} className="relative mb-48">
                  {/* Node Circle with progressive fill */}
                  <div
                    ref={(el) => {
                      nodeRefs.current[index] = el
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-7 h-7 z-20"
                  >
                    {/* Outer border */}
                    <div className="absolute inset-0 rounded-full border-2 border-foreground/40 dark:border-white/40 bg-background" />

                    {/* Fill circle that grows */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-foreground dark:border-white bg-foreground dark:bg-white"
                      style={{
                        clipPath: `inset(${(1 - nodeFillProgress) * 100}% 0 0 0)`,
                      }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Timeline Item */}
                  <TimelineItem
                    achievement={achievement}
                    isLeft={isLeft}
                    index={index}
                    totalItems={achievements.length}
                    scrollProgress={scrollYProgress.get()}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        [data-timeline-scroll]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}