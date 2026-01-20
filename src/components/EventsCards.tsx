"use client";

import React, { useState } from "react";
import { FocusCards } from "@/components/ui/focus-cards";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/payload-types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EventsCardsProps {
  events: Event[];
  isLoading?: boolean;
}

export function EventsCards({ events, isLoading = false }: EventsCardsProps) {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(0);

  // Items per page (different for mobile and desktop)
  const itemsPerPage = isMobile ? 6 : 12;

  // Map events to card format
  const cards = events.map((event) => ({
    title: event.title,
    src:
      event.image && typeof event.image === "object"
        ? event.image.url || "/placeholder.jpg"
        : "/placeholder.jpg",
    event: event, // Pass the full event object
  }));

  // Paginate cards
  const totalPages = Math.ceil(cards.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const paginatedCards = cards.slice(startIndex, startIndex + itemsPerPage);

  // Handle pagination
  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-8">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Skeleton
              key={index}
              className="rounded-3xl h-80 md:h-[40rem] w-56 md:w-96"
            />
          ))}
        </div>
      </div>
    );
  }

  // No events
  if (cards.length === 0) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-neutral-500 dark:text-neutral-400">
          No events found
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Pagination Controls at Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-8 h-8 rounded-md transition-colors ${
                  currentPage === index
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Focus Cards Grid */}
      <FocusCards cards={paginatedCards} />

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Page {currentPage + 1} of {totalPages}
        </div>
      )}
    </div>
  );
}
