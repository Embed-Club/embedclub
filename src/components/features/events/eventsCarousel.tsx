'use client'
import { CarouselNav } from '@/components/features/events/carouselNav'
import { CarouselContext } from '@/components/features/events/eventsCards'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, useReducedMotion } from 'motion/react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface CarouselProps {
  items: React.ReactNode[]
  /** Auto-advance one card at a time while idle. Off for reduced motion. */
  autoScroll?: boolean
  /** Seconds to hold on each card before advancing to the next. */
  autoScrollSecondsPerCard?: number
}

/**
 * Embla owns the actual scroll/loop mechanics (with `loop: true` it clones
 * slides as needed and always moves forward, never a visible snap back) -
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
  const autoScrolls = autoScroll && !reduceMotion && items.length > 1

  const autoplay = useRef(
    Autoplay({
      delay: autoScrollSecondsPerCard * 1000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: items.length > 1, align: 'start', skipSnaps: false, dragFree: false },
    autoScrolls ? [autoplay.current] : [],
  )

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  // Snaps rather than items: with `align: 'start'` Embla drops the snaps it
  // cannot scroll to, so a wide viewport showing the last three cards at once
  // has fewer snaps than cards - one dot per card would leave dead dots.
  const [snapCount, setSnapCount] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    setSnapCount(emblaApi.scrollSnapList().length)
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

  // The nav draws a countdown to the next card, so it needs to know when the
  // autoplay timer is actually running. Taken from the plugin's own events
  // rather than inferred from hover: the plugin also stops on drag, on focus
  // entering a slide, and whenever the document is hidden - a backgrounded tab
  // stops it outright - and a countdown reproducing only the hover rule fills
  // steadily through all of those while nothing is going to advance.
  const [autoRunning, setAutoRunning] = useState(false)
  // Bumped every time a fresh timer is set, which is what restarts the
  // countdown. It is not the same as the card changing: leaving the carousel
  // with the mouse restarts the full delay on the card you are already on.
  const [timerEpoch, setTimerEpoch] = useState(0)

  useEffect(() => {
    if (!emblaApi) return

    const onPlay = () => setAutoRunning(true)
    const onStop = () => setAutoRunning(false)
    const onTimerSet = () => {
      setAutoRunning(true)
      setTimerEpoch((epoch) => epoch + 1)
    }

    // The plugin starts on init, which is before this effect can subscribe, so
    // the first timer is already running by now and emits nothing to catch.
    setAutoRunning(emblaApi.plugins().autoplay?.isPlaying() ?? false)

    emblaApi.on('autoplay:play', onPlay)
    emblaApi.on('autoplay:stop', onStop)
    emblaApi.on('autoplay:timerset', onTimerSet)
    return () => {
      emblaApi.off('autoplay:play', onPlay)
      emblaApi.off('autoplay:stop', onStop)
      emblaApi.off('autoplay:timerset', onTimerSet)
    }
  }, [emblaApi])

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        {/* No edge fade. It was meant to suggest more cards off-screen, but
            `inset-y-20` kept it clear of the card's top and bottom, so instead
            of fading the track edge it painted a hard-edged column down the
            middle of whichever card sat under it - invisible on the light
            theme, an obvious grey stripe on the dark one. */}
        <div className="overflow-hidden py-4 md:py-8" ref={emblaRef}>
          {/* Slide elements are plain divs on purpose. Embla's loop works by
              writing `transform: translateX(...)` onto individual slides to
              reposition them around the wrap point - if the slide is a
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
        {/* Centred, not flush right as the bare arrows were: it now carries the
            dots too, so it reads as the carousel's own controls rather than a
            pair of buttons parked in a corner. The px keeps it off the screen
            edge on mobile, where the card track bleeds to it. */}
        <div className="relative z-40 px-4 md:px-0">
          <CarouselNav
            snapCount={snapCount}
            selectedIndex={currentIndex}
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
            onPrev={() => emblaApi?.scrollPrev()}
            onNext={() => emblaApi?.scrollNext()}
            onSelect={(index) => emblaApi?.scrollTo(index)}
            // Undefined when nothing auto-advances, so the dot shows a plain
            // fill rather than a countdown to an advance that never comes.
            autoDelaySeconds={autoScrolls ? autoScrollSecondsPerCard : undefined}
            autoRunning={autoRunning}
            restartKey={timerEpoch}
          />
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
