'use client'

import * as React from 'react'
import { motion, useTransform } from 'motion/react'
import { useTimelineScroll } from '@/hooks/useTimelineScroll'

// Simple className merger
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================================================
// Types
// ============================================================================

export interface TimelineItemData {
  id: string
  title: string
  text?: string
  description?: string
  image: string | null
  imageUrl?: string
  [key: string]: any
}

export interface TimelineContextValue {
  nodeFillLevels: number[]
  nodeRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  registerNode: (index: number) => (el: HTMLDivElement | null) => void
  isMobile: boolean
  scrollProgress: number
  items: TimelineItemData[]
}

// ============================================================================
// Context
// ============================================================================

const TimelineContext = React.createContext<TimelineContextValue | undefined>(undefined)

function useTimelineContext() {
  const context = React.useContext(TimelineContext)
  if (!context) {
    throw new Error('Timeline components must be used within a Timeline')
  }
  return context
}

// ============================================================================
// Timeline (Root Component)
// ============================================================================

export interface TimelineProps {
  items: TimelineItemData[]
  fillDistance?: number
  showHeader?: boolean
  headerText?: string
  className?: string
  mobilePosition?: 'left' | 'right'
}

export function Timeline({
  items,
  fillDistance = 100,
  showHeader = true,
  headerText = 'Timeline',
  className,
  mobilePosition = 'right',
}: TimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const timelineBarRef = React.useRef<HTMLDivElement>(null)
  const nodeRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [nodeFillLevels, setNodeFillLevels] = React.useState<number[]>(
    new Array(items.length).fill(0),
  )
  const [scrollProgress, setScrollProgress] = React.useState(0)

  const { scrollYProgress, isMobile } = useTimelineScroll(containerRef)

  // Calculate node fill based on white bar position
  React.useEffect(() => {
    const calculateFill = () => {
      if (!contentRef.current || !timelineBarRef.current) return

      const contentRect = contentRef.current.getBoundingClientRect()
      const contentTop = contentRect.top

      const progress = scrollYProgress.get()
      setScrollProgress(progress)

      const totalBarHeight = timelineBarRef.current.clientHeight
      const currentBarHeight = progress * totalBarHeight
      const barBottomPosition = contentTop + currentBarHeight

      const fillLevels = nodeRefs.current.map((nodeRef) => {
        if (!nodeRef) return 0

        const nodeRect = nodeRef.getBoundingClientRect()
        const nodeCenterY = nodeRect.top + nodeRect.height / 2
        const distanceToNode = nodeCenterY - barBottomPosition

        if (distanceToNode <= 0) {
          return 1
        } else if (distanceToNode <= fillDistance) {
          return 1 - distanceToNode / fillDistance
        } else {
          return 0
        }
      })

      setNodeFillLevels(fillLevels)
    }

    const unsubscribe = scrollYProgress.on('change', calculateFill)
    setTimeout(calculateFill, 100)

    return () => unsubscribe()
  }, [scrollYProgress, items, fillDistance])

  const registerNode = React.useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      nodeRefs.current[index] = el
    }
  }, [])

  const contextValue: TimelineContextValue = {
    nodeFillLevels,
    nodeRefs,
    registerNode,
    isMobile,
    scrollProgress,
    items,
  }

  // Determine timeline bar position classes
  const getBarPositionClass = () => {
    if (isMobile) {
      return mobilePosition === 'left'
        ? 'left-[32px] -translate-x-1/2'
        : 'right-[16px] translate-x-1/2'
    }
    return 'left-1/2 -translate-x-1/2'
  }

  const barPositionClass = getBarPositionClass()

  // Container scroll styles - only for desktop
  const containerScrollStyles = !isMobile
    ? {
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
        WebkitOverflowScrolling: 'touch' as const,
        touchAction: 'pan-y' as const,
        overscrollBehavior: 'contain' as const,
      }
    : {}

  return (
    <TimelineContext.Provider value={contextValue}>
      <div className={cn('relative w-full h-full', className)}>
        {/* Fixed Header - Desktop only */}
        {showHeader && !isMobile && (
          <div className="absolute top-0 left-0 right-0 z-10 p-8 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        )}

        {/* Scrollable Content - only scrollable on desktop */}
        <div
          ref={containerRef}
          data-timeline-scroll
          className={cn('w-full h-full', !isMobile && 'overflow-y-scroll overflow-x-hidden')}
          style={containerScrollStyles}
        >
          <div
            ref={contentRef}
            className={cn('relative w-full', !isMobile ? 'min-h-full pt-12 pb-24' : 'pt-16 pb-12')}
          >
            {/* Timeline heading inside scroll container for desktop */}
            {showHeader && !isMobile && (
              <div className="relative mb-16 px-8 md:left-10">
                <h1 className="text-xl md:left-20 font-medium md:text-4xl">{headerText}</h1>
              </div>
            )}

            {/* Fixed Header Gradient for mobile (timeline bar only) */}
            {isMobile && (
              <div
                className={cn(
                  'absolute top-0 z-10 h-16 w-20 pointer-events-none bg-gradient-to-b from-background to-transparent',
                  barPositionClass,
                )}
              />
            )}

            {/* Timeline Bar */}
            <div
              ref={timelineBarRef}
              className={cn('absolute top-0 bottom-20 w-3 pointer-events-none', barPositionClass)}
            >
              <div className="absolute top-0 bottom-0 w-full rounded-full border-2 border-foreground/40 dark:border-white/40 bg-transparent" />
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[8px] bg-foreground dark:bg-white rounded-full origin-top"
                style={{
                  height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']),
                }}
              />
            </div>

            {/* Timeline Items */}
            <div className="relative">
              {items.map((item, index) => (
                <TimelineItemWrapper key={item.id} item={item} index={index} totalItems={items.length} mobilePosition={mobilePosition} />
              ))}
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
    </TimelineContext.Provider>
  )
}

// ============================================================================
// TimelineItemWrapper - Renders differently for desktop vs mobile
// ============================================================================

interface TimelineItemWrapperProps {
  item: TimelineItemData
  index: number
  totalItems: number
  mobilePosition: 'left' | 'right'
}

function TimelineItemWrapper({ item, index, totalItems, mobilePosition }: TimelineItemWrapperProps) {
  const { isMobile, nodeFillLevels, registerNode, scrollProgress, nodeRefs } = useTimelineContext()
  const nodeFillProgress = nodeFillLevels[index] || 0
  const isLeft = index % 2 === 0

  if (isMobile) {
    return (
      <div className="relative mb-8">
        {/* Node Circle */}
        <TimelineNode index={index} />
        
        {/* Mobile Content */}
        <TimelineContentMobile index={index} item={item} position={mobilePosition} />
      </div>
    )
  }

  // Desktop view
  return (
    <div className="relative mb-48">
      {/* Node Circle with progressive fill */}
      <div
        ref={registerNode(index)}
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

      {/* Desktop Timeline Item */}
      <TimelineItemDesktop
        item={item}
        isLeft={isLeft}
        index={index}
        totalItems={totalItems}
        scrollProgress={scrollProgress}
      />
    </div>
  )
}

// ============================================================================
// TimelineItemDesktop - Desktop layout
// ============================================================================

interface TimelineItemDesktopProps {
  item: TimelineItemData
  isLeft: boolean
  index: number
  totalItems: number
  scrollProgress: number
}

function TimelineItemDesktop({ item, isLeft, index, totalItems, scrollProgress }: TimelineItemDesktopProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const { nodeRefs } = useTimelineContext()

  const itemProgress = index / (totalItems - 1)
  const visibilityThreshold = itemProgress - 0.1

  React.useEffect(() => {
    if (scrollProgress >= visibilityThreshold) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [scrollProgress, visibilityThreshold])

  const text = item.text || item.description || ''
  const imageUrl = item.image || item.imageUrl
  const hasImage = imageUrl !== null && imageUrl !== undefined

  return (
    <div className="flex items-center gap-16 px-8 max-w-7xl mx-auto">
      {/* Left Side */}
      <motion.div
        className="flex-1"
        initial={{ opacity: 0, x: -50 }}
        animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {isLeft ? (
          // Card text on left
          <div className="bg-card/80 dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-lg p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <h3 className="text-card-foreground dark:text-white text-xl font-semibold mb-3">
              {item.title}
            </h3>
            <p className="text-card-foreground/90 dark:text-white/90 leading-relaxed">
              {text}
            </p>
          </div>
        ) : hasImage ? (
          // Image on left (when card is on right)
          <div className="rounded-lg overflow-hidden">
            <img
              src={imageUrl || ''}
              alt="Achievement"
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
        ) : (
          // Empty space when no image and card is on right
          <div />
        )}
      </motion.div>

      {/* Center Space for Timeline */}
      <div className="w-0" />

      {/* Right Side */}
      <motion.div
        className="flex-1"
        initial={{ opacity: 0, x: 50 }}
        animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        {!isLeft ? (
          // Card text on right
          <div className="bg-card/80 dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-lg p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <h3 className="text-card-foreground dark:text-white text-xl font-semibold mb-3">
              {item.title}
            </h3>
            <p className="text-card-foreground/90 dark:text-white/90 leading-relaxed">
              {text}
            </p>
          </div>
        ) : hasImage ? (
          // Image on right (when card is on left)
          <div className="rounded-lg overflow-hidden">
            <img
              src={imageUrl || ''}
              alt="Achievement"
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
        ) : (
          // Empty space when no image and card is on left
          <div />
        )}
      </motion.div>
    </div>
  )
}

// ============================================================================
// TimelineNode - Mobile version only
// ============================================================================

interface TimelineNodeProps {
  index: number
}

function TimelineNode({ index }: TimelineNodeProps) {
  const { nodeFillLevels, registerNode, isMobile } = useTimelineContext()
  const nodeFillProgress = nodeFillLevels[index] || 0

  if (!isMobile) return null

  return (
    <div
      ref={registerNode(index)}
      className="absolute w-7 h-7 z-20 right-[16px] translate-x-1/2"
      style={{ top: '20px' }}
    >
      {/* Outer border */}
      <div className="absolute inset-0 rounded-full border-2 border-foreground/40 dark:border-white/40 bg-background" />

      {/* Fill circle */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-foreground dark:border-white bg-foreground dark:bg-white"
        style={{
          clipPath: `inset(${(1 - nodeFillProgress) * 100}% 0 0 0)`,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </div>
  )
}

// ============================================================================
// TimelineContentMobile - Mobile content layout
// ============================================================================

interface TimelineContentMobileProps {
  index: number
  item: TimelineItemData
  position: 'left' | 'right'
}

function TimelineContentMobile({ index, item, position }: TimelineContentMobileProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  // Use Intersection Observer to detect when card enters viewport
  React.useEffect(() => {
    const element = cardRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Card appears when 20% of it is visible
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          setIsVisible(true)
        }
      },
      {
        threshold: [0, 0.2, 0.5, 1], // Multiple thresholds for smooth detection
        rootMargin: '-50px 0px -50px 0px', // Trigger slightly before it's fully in view
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const isLeft = position === 'left'
  const text = item.text || item.description || ''
  const imageUrl = item.image || item.imageUrl

  return (
    <div className="relative" ref={cardRef}>
      <div
        className={cn(
          'flex items-start gap-2',
          isLeft ? 'flex-row pl-2 pr-2' : 'flex-row-reverse pr-0 pl-2',
        )}
      >
        <div className="flex-shrink-0 w-[32px]" />

        <motion.div
          className="flex-1 max-w-[92%]"
          initial={{ opacity: 0, x: isLeft ? 50 : -50 }}
          animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? 50 : -50 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="bg-card/80 dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-lg p-6 shadow-lg transition-all duration-300">
            <h3 className="text-card-foreground dark:text-white font-semibold text-lg mb-3">
              {item.title}
            </h3>
            <p className="text-card-foreground/90 dark:text-white/90 text-sm leading-relaxed mb-3">
              {text}
            </p>
            {imageUrl && (
              <div className="relative w-full aspect-square max-w-[280px] rounded-lg overflow-hidden">
                <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}