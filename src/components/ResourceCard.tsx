"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ResourceCardData } from "@/app/(frontend)/resources/ResourcesPageContent";

interface ResourceCardProps {
  card: ResourceCardData;
  index?: number;
}

export const ResourceCard = React.memo(
  ({ card, index }: ResourceCardProps) => {
    return (
    <Link
      href={`/resources/${card.slug}`}
      aria-label={`Open resource: ${card.title}`}
      className={cn(
        "block rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      )}
    >
      <img
        src={card.image}
        alt={card.title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/0 hover:bg-black/50 flex flex-col items-end justify-end py-4 px-4 transition-all duration-300">
        <div className="w-full">
          <div className="text-sm md:text-base font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
            {card.title}
          </div>
          <p className="text-xs md:text-sm text-gray-200 mt-2 line-clamp-2">
            {card.description}
          </p>
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {card.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-500/50 text-white rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
    );
  }
);

ResourceCard.displayName = "ResourceCard";
