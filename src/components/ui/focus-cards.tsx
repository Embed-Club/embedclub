"use client";

import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EventModal, eventToCard } from "@/components/EventsCards";
import type { Event } from "@/payload-types";
import { useOutsideClick } from "@/hooks/use-outside-click";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onClick,
  }: {
    card: Card;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onClick: () => void;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out",
        hovered !== null && hovered !== index && "md:blur-sm md:scale-[0.98]"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className={cn(
          "absolute inset-0 bg-black/0 md:bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300 opacity-100 md:opacity-0",
          hovered === index ? "md:opacity-100" : "md:opacity-0"
        )}
      >
        <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
          {card.title}
        </div>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
  event?: Event;
};

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const activeEvent =
    activeIndex === null ? undefined : cards[activeIndex]?.event;

  useOutsideClick(modalRef, () => setActiveIndex(null));

  const activeCard = useMemo(() => {
    if (activeIndex === null) return null;
    const card = cards[activeIndex];
    if (!card) return null;
    if (card.event) {
      return eventToCard(card.event);
    }
    return {
      src: card.src,
      title: card.title,
      category: "Event",
      content: null,
    };
  }, [activeIndex, cards]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full md:px-8">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          onClick={() => setActiveIndex(index)}
        />
      ))}
      {activeCard && (
        <EventModal
          open={activeIndex !== null}
          onClose={() => setActiveIndex(null)}
          card={activeCard}
          event={activeEvent}
          containerRef={modalRef}
        />
      )}
    </div>
  );
}
