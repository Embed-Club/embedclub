"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type { Event } from "@/payload-types";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDetailsModal } from "@/components/EventsCards";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onClick,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onClick: () => void;
  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImageLoading(true);
      setHasError(false);

      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }, [card.src]);

    const handleImageLoad = () => {
      setImageLoading(false);
      setHasError(false);
    };

    const handleImageError = () => {
      setImageLoading(false);
      setHasError(true);
    };

    return (
      <div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
        className={cn(
          "rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out cursor-pointer",
          hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
        )}
      >
        {imageLoading && (
          <Skeleton className="absolute inset-0 z-20 h-full w-full rounded-lg" />
        )}
        {hasError ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-800 text-neutral-400">
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            src={card.src}
            alt={card.title}
            className={cn(
              "object-cover absolute inset-0 h-full w-full transition-opacity duration-500",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300",
            hovered === index ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
            {card.title}
          </div>
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
  event?: Event;
};

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (selectedCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [selectedCard]);

  if (!cards || cards.length === 0) {
    return <div className="text-center py-20">No cards to display</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full">
        {cards.map((card, index) => (
          <Card
            key={card.title}
            card={card}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
            onClick={() => setSelectedCard(card)}
          />
        ))}
      </div>

      {/* Use shared EventDetailsModal */}
      <EventDetailsModal
        isOpen={!!selectedCard && !!selectedCard.event}
        event={selectedCard?.event || null}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}
