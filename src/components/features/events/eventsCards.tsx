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
import { createPortal } from 'react-dom'

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

  // Rendered into <body> rather than in place. `position: fixed` is only
  // relative to the viewport while no ancestor is transformed — and Embla
  // moves the carousel by writing `transform: translate3d(...)` on the slide
  // track, which makes that track the containing block for anything fixed
  // inside it. Opening a card from the carousel therefore drew the whole modal
  // inside one slide, clipped by the track's overflow-hidden. The grid below
  // was fine only because nothing there is transformed.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
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
            className={cn(
              'relative z-[60] max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-card font-sans text-card-foreground',
              cutoutCardSurfaceShadowClassName,
            )}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {isFallback ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
                <img
                  src="/placeholder/NoNetwork.svg"
                  alt="Service unavailable"
                  className="h-40 w-40 opacity-60 dark:invert md:h-56 md:w-56"
                />
                <div className="max-w-sm text-center">
                  <p className="text-2xl font-bold text-foreground">
                    Service Temporarily Unavailable
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    We're unable to load event details at the moment. This could be due to a
                    temporary database connection issue. Please try again in a few moments, or
                    contact support if the problem persists.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid h-full max-h-[90vh] grid-cols-1 gap-8 overflow-y-auto p-2 md:grid-cols-2 md:p-8 lg:p-10">
                {/* Image Section — same cutout inset label as the card it opened from */}
                <div className="relative flex h-full min-h-[16rem] items-stretch justify-center overflow-hidden rounded-2xl bg-muted">
                  <BlurImage src={card.src} alt={card.title} fill className="object-contain" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />

                  <CutoutCardInsetLabel className="bottom-0 left-0 z-10 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-3 text-left">
                    <motion.p
                      layoutId={layoutId ? `category-${card.category}` : undefined}
                      className="text-left text-[11px] font-semibold uppercase tracking-widest text-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {card.category}
                    </motion.p>
                    <motion.p
                      layoutId={layoutId ? `title-${card.title}` : undefined}
                      className="mt-1 text-base font-semibold text-foreground md:text-xl [text-wrap:balance]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {card.title}
                    </motion.p>
                    <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
                    <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
                  </CutoutCardInsetLabel>
                </div>

                {/* Details Section */}
                <div className="flex flex-col justify-start space-y-4 md:space-y-6">
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
    </AnimatePresence>,
    document.body,
  )
}

export const BlurImage = ({ height, width, src, className, alt, fill, ...rest }: ImageProps) => {
  const [isLoading, setLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  // The blur must never outlive the image, and `onLoad` alone can't guarantee
  // that: a cached image is already `complete` before React attaches the
  // handler, and our CDN images can stay `complete === false` indefinitely even
  // once they have decoded and painted. So drive the state off the element —
  // `decode()` settles as soon as the bitmap is usable, and resolves
  // immediately for an already-decoded one. Rejection (decode error, or the
  // src being swapped mid-flight) also clears, since a stuck blur is worse
  // than an unblurred broken image.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run per src
  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    let cancelled = false
    const clear = () => {
      if (!cancelled) setLoading(false)
    }
    // `naturalWidth`, not `complete`: a lazy image restored from cache inside
    // the carousel's overflow-hidden track can sit at `complete === false`
    // forever, with neither `load` nor `decode()` ever settling — but it has
    // real dimensions and paints fine. Dimensions mean there is a bitmap.
    if (img.naturalWidth > 0) {
      clear()
      return
    }
    img.decode().then(clear, clear)
    return () => {
      cancelled = true
    }
  }, [src])

  return (
    <img
      ref={imgRef}
      className={cn(
        'h-full w-full transition duration-300',
        // No filter class once loaded, rather than `blur-0`. `blur(0px)` is not
        // `none`: it still promotes the image to its own composited layer and
        // routes it through the filter pipeline, and stacked with the card's
        // transition-transform and Embla's translate3d on the track, Chrome
        // rasterises that layer at the wrong scale — leaving the image
        // permanently soft long after it has finished loading. The grid cards
        // never set a filter, which is why only the carousel looked blurry.
        isLoading && 'blur-sm',
        className,
      )}
      onLoad={() => setLoading(false)}
      // A broken image must not stay blurred behind a permanent placeholder.
      onError={() => setLoading(false)}
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
