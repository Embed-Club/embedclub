'use client'
import {
  CutoutCardInsetLabel,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { EventDetails } from '@/components/features/events/eventDetails'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { isNewEvent } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import type { Event } from '@/payload/payload-types'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ImageProps } from 'next/image'
import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

type EventCardData = {
  src: string
  title: string
  category: string
  content: React.ReactNode
  isFallback?: boolean
}

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void
  currentIndex: number
}>({
  onCardClose: () => {},
  currentIndex: 0,
})

export const Card = ({
  card,
  index,
  layout = false,
  event,
}: {
  card: EventCardData
  index: number
  layout?: boolean
  event?: Event
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useOutsideClick(containerRef, () => handleClose())

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    onCardClose(index)
  }

  return (
    <>
      <EventModal
        open={open}
        onClose={handleClose}
        card={card}
        event={event}
        containerRef={containerRef}
        layoutId={layout ? `card-${card.title}` : undefined}
      />

      {/* Carousel card — same cutout shell as the grid below it: notched
          inset title strip, notched New pin, 16px radius. */}
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'group/cutout relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-2xl bg-card p-0 outline-none md:h-[40rem] md:w-96',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        <BlurImage
          src={card.src}
          alt={card.title}
          fill
          className="absolute inset-0 z-10 object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover/cutout:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-background/35 via-transparent to-transparent dark:from-background/50" />

        {isNewEvent(event?.eventDate) && (
          <CutoutCardPin className="top-0 right-0 z-40 rounded-bl-[16px] bg-primary px-3 py-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
              New
            </span>
            <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-primary" />
            <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-primary" />
          </CutoutCardPin>
        )}

        <CutoutCardInsetLabel className="bottom-0 left-0 z-40 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-3 text-left">
          <motion.p
            layoutId={layout ? `category-${card.category}` : undefined}
            className="text-left font-sans text-[11px] font-semibold uppercase tracking-widest text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {card.category}
            {event?.eventMode === 'online' && ' · Online'}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="mt-1 font-sans text-base font-semibold [text-wrap:balance] text-foreground md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {card.title}
          </motion.p>
          <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
          <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
        </CutoutCardInsetLabel>
      </motion.button>
    </>
  )
}

export const EventModal = ({
  open,
  onClose,
  card,
  event,
  containerRef,
  layoutId,
}: {
  open: boolean
  onClose: () => void
  card: EventCardData
  event?: Event
  containerRef?: React.RefObject<HTMLDivElement | null>
  layoutId?: string
}) => {
  const isFallback = Boolean(card.isFallback)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 md:py-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={containerRef}
            layoutId={layoutId}
            className="relative z-[60] w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl md:rounded-3xl bg-white font-sans dark:bg-neutral-900"
          >
            <button
              type="button"
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            {isFallback ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
                <img
                  src="/placeholder/NoNetwork.svg"
                  alt="Service unavailable"
                  className="h-40 w-40 md:h-56 md:w-56 dark:invert opacity-60"
                />
                <div className="text-center max-w-sm">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Service Temporarily Unavailable
                  </p>
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    We're unable to load event details at the moment. This could be due to a
                    temporary database connection issue. Please try again in a few moments, or
                    contact support if the problem persists.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 gap-8 p-2 md:p-8 lg:p-10 md:grid-cols-2 overflow-y-auto max-h-[90vh]">
                {/* Image Section */}
                <div className="flex h-full items-stretch justify-center">
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <BlurImage src={card.src} alt={card.title} fill className="object-cover" />
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col justify-start space-y-4 md:space-y-6">
                  <div>
                    <motion.p
                      className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {card.category}
                    </motion.p>
                    <motion.p
                      className="mt-2 text-3xl font-bold text-neutral-900 md:text-4xl dark:text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {card.title}
                    </motion.p>
                  </div>

                  {/* Content (Event Details) */}
                  <div className="flex-1 pr-4">
                    {event ? <EventDetails event={event} /> : card.content}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const BlurImage = ({ height, width, src, className, alt, fill, ...rest }: ImageProps) => {
  const [isLoading, setLoading] = useState(true)
  return (
    <img
      className={cn(
        'h-full w-full transition duration-300',
        isLoading ? 'blur-sm' : 'blur-0',
        className,
      )}
      onLoad={() => setLoading(false)}
      src={src as string}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt || ''}
      aria-hidden={!alt}
      {...rest}
    />
  )
}

export type { EventCardData }

/**
 * Helper function to convert Event data to Card type
 * Extracts image URL and basic info from Event collection
 */
export const eventToCard = (event: Event): EventCardData => {
  const imageUrl =
    typeof event.image === 'object' && event.image !== null && 'url' in event.image
      ? event.image.url || '/placeholder/placeholder.jpg'
      : '/placeholder/placeholder.jpg'

  return {
    src: imageUrl,
    title: event.title || 'Untitled Event',
    category: event.category || 'Event',
    content: <EventDetails event={event} />,
  }
}

/**
 * EventCard - Reusable card component for displaying event information
 * Combines Card UI with Event data
 */
export const EventCard = ({
  event,
  index,
  layout = false,
}: {
  event: Event
  index: number
  layout?: boolean
}) => {
  const card = eventToCard(event)

  return <Card card={card} index={index} layout={layout} event={event} />
}
