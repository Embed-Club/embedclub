'use client'
import { CarouselContext } from '@/components/features/events/eventsCards'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import React, { useEffect, useState } from 'react'

export interface CarouselProps {
  items: React.ReactNode[]
  initialScroll?: number
  /** Auto-advance one card at a time while idle. Off for reduced motion. */
  autoScroll?: boolean
  /** Seconds to hold on each card before advancing to the next. */
  autoScrollSecondsPerCard?: number
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

/** Card width + gap, matching the `gap-4` flex row below. */
const step = () => (isMobile() ? 230 + 16 : 384 + 16)

export const Carousel = ({
  items,
  initialScroll = 0,
  autoScroll = true,
  autoScrollSecondsPerCard = 3.5,
}: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()

  // Two back-to-back copies of the same list — once scroll position passes
  // the first copy, it's rewound by exactly one copy's width, so the loop
  // never runs out of track (and never visibly jumps, since copy two is
  // pixel-identical to copy one). Every position change here goes through
  // `scrollBy`/`scrollTo` rather than assigning `.scrollLeft` directly —
  // some contexts (backgrounded tabs among them) don't reliably commit a
  // bare property write, where the scroll methods always do.
  const loopEnabled = items.length > 1
  const loopedItems = loopEnabled ? [...items, ...items] : items

  const oneSetWidth = () => {
    const el = carouselRef.current
    if (!el || !loopEnabled) return 0
    return el.scrollWidth / 2
  }

  const rewindIfNeeded = () => {
    const el = carouselRef.current
    if (!el || !loopEnabled) return
    const setWidth = oneSetWidth()
    if (setWidth <= 0) return
    if (el.scrollLeft >= setWidth) {
      el.scrollBy({ left: -setWidth, behavior: 'instant' })
    } else if (el.scrollLeft < 0) {
      el.scrollBy({ left: setWidth, behavior: 'instant' })
    }
  }

  const checkScrollability = () => {
    const el = carouselRef.current
    if (!el) return

    if (loopEnabled) {
      rewindIfNeeded()
      setCanScrollLeft(true)
      setCanScrollRight(true)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth)
  }

  useEffect(() => {
    if (carouselRef.current && initialScroll) {
      carouselRef.current.scrollBy({ left: initialScroll, behavior: 'instant' })
    }
    checkScrollability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScroll])

  const scrollLeftBy = (amount: number) => {
    const el = carouselRef.current
    if (!el) return
    // Give ourselves room to animate backward past zero before the loop
    // rewind would otherwise clamp it.
    if (loopEnabled && el.scrollLeft < amount) {
      el.scrollBy({ left: oneSetWidth(), behavior: 'instant' })
    }
    el.scrollBy({ left: -amount, behavior: 'smooth' })
    // The `scroll` event drives the rewind in normal use; this is a
    // belt-and-suspenders check in case it doesn't fire (e.g. some
    // automated/background-tab contexts suppress it for JS-driven scrolls).
    window.setTimeout(rewindIfNeeded, 500)
  }

  const scrollRightBy = (amount: number) => {
    carouselRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
    window.setTimeout(rewindIfNeeded, 500)
  }

  const handleCardClose = (index: number) => {
    const el = carouselRef.current
    if (el) {
      const cardWidth = isMobile() ? 230 : 384
      const gap = 16
      const targetPosition = (cardWidth + gap) * (index + 1)
      el.scrollBy({ left: targetPosition - el.scrollLeft, behavior: 'smooth' })
      setCurrentIndex(index)
    }
  }

  // Auto-advance one card at a time, like a normal carousel — smooth-scroll
  // to the next card, hold, repeat — rather than a continuous drift. Paused
  // on hover/touch/focus so reading a card doesn't fight the user, and
  // skipped under prefers-reduced-motion.
  useEffect(() => {
    if (!autoScroll || reduceMotion || paused || !loopEnabled) return

    const id = window.setInterval(() => {
      scrollRightBy(step())
    }, autoScrollSecondsPerCard * 1000)

    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScroll, autoScrollSecondsPerCard, reduceMotion, paused, loopEnabled])

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-20"
          ref={carouselRef}
          onScroll={checkScrollability}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className={cn(
              'absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l pointer-events-none',
            )}
          />

          <div className={cn('flex flex-row justify-start gap-4 pl-4', 'mx-auto max-w-7xl')}>
            {loopedItems.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * (index % items.length),
                    ease: 'easeOut',
                  },
                }}
                // biome-ignore lint/suspicious/noArrayIndexKey: stable position in a duplicated, reorder-free list
                key={`card${index}`}
                className={cn(
                  'rounded-3xl',
                  index === loopedItems.length - 1 && !loopEnabled && 'pr-[5%] md:pr-[33%]',
                )}
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mr-10 flex justify-end gap-2">
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            onClick={() => scrollLeftBy(step())}
            disabled={!canScrollLeft}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            onClick={() => scrollRightBy(step())}
            disabled={!canScrollRight}
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

export {
  Card,
  BlurImage,
  type EventCardData as CardType,
} from '@/components/features/events/eventsCards'
