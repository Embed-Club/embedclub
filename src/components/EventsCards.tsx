"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ImageProps } from "next/image";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { EventDetails } from "@/components/EventDetails";
import type { Event } from "@/payload-types";

type Card = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Card = ({
  card,
  index,
  layout = false,
  event,
}: {
  card: Card;
  index: number;
  layout?: boolean;
  event?: Event;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

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
      
      {/* Carousel Card Preview - Vertical Layout (Original) */}
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] md:w-96 dark:bg-neutral-900"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">
          <motion.p
            layoutId={layout ? `category-${card.category}` : undefined}
            className="text-left font-sans text-sm font-medium text-white md:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {card.category}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {card.title}
          </motion.p>
        </div>
        <BlurImage
          src={card.src}
          alt={card.title}
          fill
          className="absolute inset-0 z-10 object-cover"
        />
      </motion.button>
    </>
  );
};

export const EventModal = ({
  open,
  onClose,
  card,
  event,
  containerRef,
  layoutId,
}: {
  open: boolean;
  onClose: () => void;
  card: Card;
  event?: Event;
  containerRef?: React.RefObject<HTMLDivElement>;
  layoutId?: string;
}) => (
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
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="grid grid-cols-1 gap-8 p-2 md:p-8 lg:p-10 md:grid-cols-2 overflow-y-auto max-h-[90vh]">
            {/* Image Section */}
            <div className="flex items-start md:items-center justify-center">
              <div className="relative h-52 w-full overflow-hidden rounded-2xl md:h-96">
                <BlurImage
                  src={card.src}
                  alt={card.title}
                  fill
                  className="object-cover"
                />
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
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  fill,
  ...rest
}: ImageProps) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <img
      className={cn(
        "h-full w-full transition duration-300",
        isLoading ? "blur-sm" : "blur-0",
        className,
      )}
      onLoad={() => setLoading(false)}
      src={src as string}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt ? alt : "Background of a beautiful view"}
      {...rest}
    />
  );
};

export type { Card };

/**
 * Helper function to convert Event data to Card type
 * Extracts image URL and basic info from Event collection
 */
export const eventToCard = (event: Event): Card => {
  const imageUrl =
    typeof event.image === "string"
      ? event.image
      : event.image?.url || "/placeholder-event.jpg";

  return {
    src: imageUrl,
    title: event.title || "Untitled Event",
    category: event.category || "Event",
    content: <EventDetails event={event} />,
  };
};

/**
 * EventCard - Reusable card component for displaying event information
 * Combines Card UI with Event data
 */
export const EventCard = ({
  event,
  index,
  layout = false,
}: {
  event: Event;
  index: number;
  layout?: boolean;
}) => {
  const card = eventToCard(event);

  return <Card card={card} index={index} layout={layout} event={event} />;
};
