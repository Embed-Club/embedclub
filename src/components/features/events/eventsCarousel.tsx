'use client'
import { CarouselContext } from '@/components/features/events/eventsCards'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

export interface CarouselProps {
  items: React.ReactNode[]
  /** Auto-advance one card at a time while idle. Off for reduced motion. */
  autoScroll?: boolean
  /** Seconds to hold on each card before advancing to the next. */
  autoScrollSecondsPerCard?: number
}

/**
 * Embla owns the actual scroll/loop mechanics (with `loop: true` it clones
 * slides as needed and always moves forward, never a visible snap back) —
 * a hand-rolled duplicate-list-plus-rewind version of this kept producing
 * visible glitches at the wrap point. Embla + its autoplay plugin is the
 * same combination shadcn/ui's own Carousel uses for this exact case.
 */
export const Carousel = ({
  items,
  autoScroll = true,
  autoScrollSecondsPerCard = 3.5,
}: CarouselProps) => {
  const reduceMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)

  const autoplay = useRef(
    Autoplay({
      delay: autoScrollSecondsPerCard * 1000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: items.length > 1, align: 'start', skipSnaps: false, dragFree: false },
    autoScroll && !reduceMotion && items.length > 1 ? [autoplay.current] : [],
  )

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  const handleCardClose = (index: number) => {
    emblaApi?.scrollTo(index)
  }

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className={cn(
            'pointer-events-none absolute inset-y-10 right-0 z-[1000] w-[5%] overflow-hidden bg-gradient-to-l md:inset-y-20',
          )}
        />

        <div className="overflow-hidden py-10 md:py-20" ref={emblaRef}>
          {/* Slide elements are plain divs on purpose. Embla's loop works by
              writing `transform: translateX(...)` onto individual slides to
              reposition them around the wrap point — if the slide is a
              `motion.div`, Framer Motion writes `transform` on the same
              element and clobbers that, which stalls the carousel at the end
              and then snaps it back. Motion goes *inside* the slide instead. */}
          <div className="-ml-4 flex flex-row justify-start">
            {items.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable, unreordered list
              <div key={`card${index}`} className="min-w-0 flex-[0_0_auto] pl-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.5, delay: 0.2 * index, ease: 'easeOut' },
                  }}
                  className="rounded-3xl"
                >
                  {item}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        <div className="mr-10 flex justify-end gap-2">
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
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
