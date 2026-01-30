'use client'

import * as React from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface TimelineItem {
  id: string
  [key: string]: any
}

export interface TimelineContextValue {
  position: 'left' | 'right'
  nodeFillLevels: number[]
  nodeRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  registerNode: (index: number) => (el: HTMLDivElement | null) => void
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

export interface TimelineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  items: TimelineItem[]
  position?: 'left' | 'right'
  fillDistance?: number
  children?: (item: TimelineItem, index: number) => React.ReactNode
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ items, position = 'right', fillDistance = 100, className, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const timelineBarRef = React.useRef<HTMLDivElement>(null)
    const nodeRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const [nodeFillLevels, setNodeFillLevels] = React.useState<number[]>(new Array(items.length).fill(0))

    // Use window scroll instead of container scroll for mobile
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ['start start', 'end end'],
    })

    // Calculate node fill based on white bar position
    React.useEffect(() => {
      const calculateFill = () => {
        if (!contentRef.current || !timelineBarRef.current) return

        const contentRect = contentRef.current.getBoundingClientRect()
        const contentTop = contentRect.top

        const scrollProgress = scrollYProgress.get()
        const totalBarHeight = timelineBarRef.current.clientHeight
        const currentBarHeight = scrollProgress * totalBarHeight
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
      position,
      nodeFillLevels,
      nodeRefs,
      registerNode,
    }

    const isLeft = position === 'left'

    return (
      <TimelineContext.Provider value={contextValue}>
        <div ref={containerRef} className={cn('relative w-full', className)} {...props}>
          {/* Fixed Header Gradient (timeline bar only) */}
          <div
            className={cn(
              'absolute top-0 z-10 h-16 w-20 pointer-events-none bg-gradient-to-b from-background to-transparent',
              isLeft ? 'left-[32px] -translate-x-1/2' : 'right-[16px] translate-x-1/2',
            )}
          ></div>

          <div ref={contentRef} className="relative w-full pt-16 pb-8">
              {/* Timeline Bar */}
              <div
                ref={timelineBarRef}
                className={cn(
                  'absolute top-0 bottom-20 w-3 pointer-events-none',
                  isLeft ? 'left-[32px] -translate-x-1/2' : 'right-[16px] translate-x-1/2',
                )}
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
                  <React.Fragment key={item.id}>{children?.(item, index)}</React.Fragment>
                ))}
              </div>
            </div>
        </div>
      </TimelineContext.Provider>
    )
  },
)
Timeline.displayName = 'Timeline'

// ============================================================================
// TimelineItem
// ============================================================================

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
  children?: React.ReactNode
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ index, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative mb-12', className)} {...props}>
        {children}
      </div>
    )
  },
)
TimelineItem.displayName = 'TimelineItem'

// ============================================================================
// TimelineNode
// ============================================================================

export interface TimelineNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
  nodeClassName?: string
  fillClassName?: string
  borderClassName?: string
}

const TimelineNode = React.forwardRef<HTMLDivElement, TimelineNodeProps>(
  ({ index, className, nodeClassName, fillClassName, borderClassName, ...props }, ref) => {
    const { position, nodeFillLevels, registerNode } = useTimelineContext()
    const nodeFillProgress = nodeFillLevels[index] || 0
    const isLeft = position === 'left'

    return (
      <div
        ref={registerNode(index)}
        className={cn(
          'absolute w-7 h-7 z-20',
          isLeft ? 'left-[32px] -translate-x-1/2' : 'right-[16px] translate-x-1/2',
          className,
        )}
        style={{
          top: '20px',
        }}
        {...props}
      >
        {/* Outer border */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-foreground/40 dark:border-white/40 bg-background',
            borderClassName,
          )}
        />

        {/* Fill circle */}
        <motion.div
          className={cn('absolute inset-0 rounded-full border-2 border-foreground dark:border-white bg-foreground dark:bg-white', fillClassName)}
          style={{
            clipPath: `inset(${(1 - nodeFillProgress) * 100}% 0 0 0)`,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </div>
    )
  },
)
TimelineNode.displayName = 'TimelineNode'

// ============================================================================
// TimelineContent
// ============================================================================

export interface TimelineContentProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  index: number
}

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ index, className, children, ...props }, ref) => {
    const { position, nodeFillLevels, nodeRefs } = useTimelineContext()
    const [isVisible, setIsVisible] = React.useState(false)
    const [scrollProgress, setScrollProgress] = React.useState(0)
    const nodeFillProgress = nodeFillLevels[index] || 0
    const isLeft = position === 'left'

    // Track scroll progress similar to desktop
    React.useEffect(() => {
      const handleScroll = () => {
        if (typeof window === 'undefined') return
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
        setScrollProgress(progress)
      }

      handleScroll() // Initial calculation
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Use the same visibility logic as desktop TimelineItem
    React.useEffect(() => {
      const totalItems = nodeRefs.current.length
      const itemProgress = totalItems > 1 ? index / (totalItems - 1) : 0
      const visibilityThreshold = itemProgress - 0.1

      if (scrollProgress >= visibilityThreshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }, [scrollProgress, index, nodeRefs])

    return (
      <div ref={ref} className="relative">
        <div
          className={cn(
            'flex items-start gap-2',
            isLeft ? 'flex-row pl-2 pr-2' : 'flex-row-reverse pr-0 pl-2',
          )}
        >
          <div className="flex-shrink-0 w-[32px]" />

          <motion.div
            className={cn('flex-1 max-w-[92%]', className)}
            initial={{ opacity: 0, x: isLeft ? 50 : -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? 50 : -50 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            {...props}
          >
            {children}
          </motion.div>
        </div>
      </div>
    )
  },
)
TimelineContent.displayName = 'TimelineContent'

// ============================================================================
// TimelineCard
// ============================================================================

export interface TimelineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const TimelineCard = React.forwardRef<HTMLDivElement, TimelineCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card/80 dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-lg p-6 shadow-lg transition-all duration-300',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
TimelineCard.displayName = 'TimelineCard'

// ============================================================================
// TimelineTitle
// ============================================================================

export interface TimelineTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode
}

const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn('text-card-foreground dark:text-white font-semibold text-lg mb-3', className)} {...props}>
        {children}
      </h3>
    )
  },
)
TimelineTitle.displayName = 'TimelineTitle'

// ============================================================================
// TimelineDescription
// ============================================================================

export interface TimelineDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

const TimelineDescription = React.forwardRef<HTMLParagraphElement, TimelineDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-card-foreground/90 dark:text-white/90 text-sm leading-relaxed', className)} {...props}>
        {children}
      </p>
    )
  },
)
TimelineDescription.displayName = 'TimelineDescription'

// ============================================================================
// TimelineImage
// ============================================================================

export interface TimelineImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string
}

const TimelineImage = React.forwardRef<HTMLImageElement, TimelineImageProps>(
  ({ className, containerClassName, alt, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative w-full aspect-square max-w-[280px] rounded-lg overflow-hidden',
          containerClassName,
        )}
      >
        <img ref={ref} alt={alt} className={cn('w-full h-full object-cover', className)} {...props} />
      </div>
    )
  },
)
TimelineImage.displayName = 'TimelineImage'

// ============================================================================
// Exports
// ============================================================================

export {
  Timeline,
  TimelineItem,
  TimelineNode,
  TimelineContent,
  TimelineCard,
  TimelineTitle,
  TimelineDescription,
  TimelineImage,
}
