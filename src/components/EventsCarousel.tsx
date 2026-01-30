"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import Image, { ImageProps } from "next/image";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Skeleton } from "@/components/ui/skeleton";

export interface CarouselProps {
  items: ReactNode[];
  initialScroll?: number;
}

type Card = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

//Closing the card jumps back to the last active card
export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});


//Set the states for carousel and the cards
export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null); 
  const [canScrollLeft, setCanScrollLeft] = React.useState(false); //Scroll Left (Initial is 0)
  const [canScrollRight, setCanScrollRight] = React.useState(true); //Scroll Right (Initial, the cards exist on the right side)
  const [currentIndex, setCurrentIndex] = useState(0); //Current active card index
  const [isAutoScrolling, setIsAutoScrolling] = useState(true); //Auto Scroll, disabled on hover or click or manual scroll
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null); //
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAutoScrolling || !carouselRef.current) return;

    const scheduleNextScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearTimeout(autoScrollIntervalRef.current);
      }

      // Add human-like variation: 4.5-5.5 seconds instead of exactly 5
      const baseDelay = 5000;
      const variation = Math.random() * 1000 - 500; // -500ms to +500ms
      const delay = baseDelay + variation;

      autoScrollIntervalRef.current = setTimeout(() => {
        if (carouselRef.current && isAutoScrolling) {
          const cardWidth = window.innerWidth < 768 ? 230 : 384;
          const gap = window.innerWidth < 768 ? 4 : 8;
          const scrollAmount = cardWidth + gap;
          
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          
          // Check if we're near the end (with some buffer for precision)
          if (scrollLeft + clientWidth >= scrollWidth - 50) {
            // Smooth loop back to start
            setTimeout(() => {
              if (carouselRef.current) {
                carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                scheduleNextScroll();
              }
            }, 800); // Small pause before looping
          } else {
            // Scroll to next card
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            scheduleNextScroll();
          }
        }
      }, delay);
    };

    scheduleNextScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearTimeout(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
      pauseAutoScroll();
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
      pauseAutoScroll();
    }
  };

  const pauseAutoScroll = () => {
    setIsAutoScrolling(false);
    
    // Clear any existing resume timeout
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    
    // Resume auto-scroll after 10 seconds of inactivity (human-like behavior)
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 10000);
  };

  const handleMouseEnter = () => {
    // Temporarily pause while hovering
    if (autoScrollIntervalRef.current) {
      clearTimeout(autoScrollIntervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    // Resume if auto-scroll is enabled
    if (isAutoScrolling) {
      setIsAutoScrolling(false);
      setTimeout(() => setIsAutoScrolling(true), 100);
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-20"
          ref={carouselRef}
          onScroll={checkScrollability}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={cn(
              "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4 pl-4",
              "mx-auto max-w-7xl", // remove max-w-4xl if you want the carousel to span the full width of its container
            )}
          >
            {items.map((item, index) => (
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
                    delay: 0.2 * index,
                    ease: "easeOut",
                    once: true,
                  },
                }}
                key={"card" + index}
                className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mr-10 flex justify-end gap-2">
          <button
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ArrowLeft className="h-6 w-6 text-gray-500" />
          </button>
          <button
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ArrowRight className="h-6 w-6 text-gray-500" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose, currentIndex } = useContext(CarouselContext);

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
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
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
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
            >
              <button
                className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white"
                onClick={handleClose}
              >
                <X className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
              </button>
              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-base font-medium text-black dark:text-white"
              >
                {card.category}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.title}` : undefined}
                className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
              >
                {card.title}
              </motion.p>
              <div className="py-10">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] md:w-96 dark:bg-neutral-900"
      >
        <BlurImage
          src={card.src}
          alt={card.title}
          fill
          className="absolute inset-0 z-10 object-cover"
          onLoadingChange={setImageLoading}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">
          {imageLoading ? (
            <>
              <Skeleton className="h-4 w-16 rounded-md bg-white/20" />
              <Skeleton className="mt-2 h-8 w-32 rounded-md bg-white/20 md:h-10 md:w-48" />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </motion.button>
    </>
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  onLoadingChange,
}: ImageProps & {
  onLoadingChange?: (loading: boolean) => void;
}) => {
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
    onLoadingChange?.(true);

    const timeout = setTimeout(() => {
      setLoading(false);
      onLoadingChange?.(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [src, onLoadingChange]);

  const handleLoad = () => {
    setLoading(false);
    setHasError(false);
    onLoadingChange?.(false);
  };

  const handleError = () => {
    setLoading(false);
    setHasError(true);
    onLoadingChange?.(false);
  };

  return (
    <>
      {isLoading && (
        <Skeleton className="absolute inset-0 z-20 h-full w-full rounded-3xl" />
      )}
      {hasError ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-800 text-neutral-400">
          <span className="text-sm">Image unavailable</span>
        </div>
      ) : (
        <img
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100",
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
          src={src as string}
          loading="eager"
          decoding="async"
          alt={alt ? alt : "Background of a beautiful view"}
        />
      )}
    </>
  );
};
