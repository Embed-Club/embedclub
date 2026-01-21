"use client";

import React, { useState, useEffect, useRef } from "react";
import { FocusCards } from "@/components/ui/focus-cards";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/payload-types";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import RichTextRender from "@/components/RichTextRender";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Carousel, Card } from "@/components/EventsCarousel";

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

// Shared Event Image Modal Component
export type EventImageModalProps = {
  isOpen: boolean;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
};

export function EventImageModal({ isOpen, imageUrl, title = "", onClose }: EventImageModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if (isOpen) {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key={title || imageUrl || "image-modal"}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 overflow-auto"
          ref={fullscreenContainerRef}
          onClick={() => {
            onClose();
          }}
        >
          <motion.div
            key="img-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Close Button - Fixed top right */}
          <button
            className="fixed top-4 right-4 z-[90] p-2 text-white text-2xl hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-[80] flex-1 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={title}
              className="object-contain rounded-lg transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center",
                maxHeight: "calc(100vh - 120px)",
                maxWidth: "90vw",
              }}
            />
          </motion.div>

          {/* Zoom and Fullscreen Controls - Fixed bottom */}
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 bg-black/70 rounded-full px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom Out */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoomLevel <= 0.5}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5 text-white" />
            </button>

            {/* Zoom Level Display */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="px-3 py-1 text-white text-sm font-medium hover:bg-white/10 rounded transition-colors"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoomLevel >= 3}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5 text-white" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-white/30 mx-1" />

            {/* Fullscreen Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 text-white" />
              ) : (
                <Maximize className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Shared Event Details Modal Component - Used by both carousel and gallery
export type EventDetailsModalProps = {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
};

export function EventDetailsModal({ isOpen, event, onClose }: EventDetailsModalProps) {
  const [expandedImage, setExpandedImage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        if (expandedImage) {
          setExpandedImage(false);
        } else if (isOpen) {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, expandedImage, onClose]);

  useOutsideClick(containerRef, () => {
    if (!expandedImage) {
      onClose();
    }
  });

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      {isOpen && event && (
        <div key={event.id ?? event.title ?? "event-modal"} className="fixed inset-0 z-50 h-screen overflow-auto">
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={containerRef}
            className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
          >
            <button
              className="absolute right-4 top-4 px-2 text-2xl text-neutral-900 dark:text-white hover:opacity-80"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="space-y-6 text-neutral-800 dark:text-neutral-100">
              {/* Event Title */}
              <h2 className="text-3xl font-bold">{event.title}</h2>

              {/* Event Poster/Image */}
              {event.image && typeof event.image === "object" && event.image.url && (
                <div
                  className="relative h-64 w-full overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setExpandedImage(true)}
                >
                  <Image
                    src={event.image.url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Full Event Description */}
              {event.description && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">About this Event</h3>
                  <RichTextRender content={event.description} />
                </div>
              )}

              {/* Event Details Box */}
              {(event.venue?.roomName ||
                event.venue?.floor ||
                event.contact?.email ||
                event.contact?.phone) && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="mb-3 text-lg font-semibold">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    {event.venue?.roomName && (
                      <div className="flex gap-2">
                        <span className="font-medium">Room/Hall:</span>
                        <span>{event.venue.roomName}</span>
                      </div>
                    )}
                    {event.venue?.floor && (
                      <div className="flex gap-2">
                        <span className="font-medium">Floor:</span>
                        <span>{event.venue.floor}</span>
                      </div>
                    )}
                    {event.contact?.phone && (
                      <div className="flex gap-2">
                        <span className="font-medium">Phone:</span>
                        <a
                          href={`tel:${event.contact.phone}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {event.contact.phone}
                        </a>
                      </div>
                    )}
                    {event.contact?.email && (
                      <div className="flex gap-2">
                        <span className="font-medium">Email:</span>
                        <a
                          href={`mailto:${event.contact.email}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {event.contact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map Section */}
              {typeof event.location?.coords?.lat === "number" &&
                typeof event.location?.coords?.lng === "number" && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Location</h3>
                      <a
                        href={`https://www.google.com/maps?q=${event.location.coords.lat},${event.location.coords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                    {event.location.address && (
                      <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {event.location.address}
                      </p>
                    )}
                    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <iframe
                        width="100%"
                        height="300"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.location.coords.lng - 0.01},${event.location.coords.lat - 0.01},${event.location.coords.lng + 0.01},${event.location.coords.lat + 0.01}&layer=mapnik&marker=${event.location.coords.lat},${event.location.coords.lng}`}
                        allowFullScreen
                      ></iframe>
                      <div className="bg-neutral-100 p-2 text-center dark:bg-neutral-800">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${event.location.coords.lat}&mlon=${event.location.coords.lng}&zoom=${event.location.zoom || 15}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                        >
                          View Larger Map
                        </a>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Zoom Modal */}
      <EventImageModal
        isOpen={expandedImage && !!event?.image && typeof event?.image === "object" && !!event?.image?.url}
        imageUrl={event && typeof event.image === "object" ? event.image?.url || "" : ""}
        title={event?.title || ""}
        onClose={() => setExpandedImage(false)}
      />
    </AnimatePresence>
  );
}

// Carousel wrapper that reuses the shared EventDetailsModal
export function CarouselWithModal({ events }: { events: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const items = events.map((event, index) => (
    <div
      key={event.id}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedEvent(event);
      }}
      className="cursor-pointer w-full h-full"
      style={{ pointerEvents: "auto" }}
    >
      <div style={{ pointerEvents: "none" }}>
        <Card
          index={index}
          layout
          card={{
            src:
              event.image && typeof event.image === "object"
                ? event.image.url || "/placeholder.jpg"
                : "/placeholder.jpg",
            title: event.title,
            category: event.category,
            content: <div />,
          }}
        />
      </div>
    </div>
  ));

  return (
    <>
      <Carousel items={items} initialScroll={0} />
      <EventDetailsModal
        isOpen={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}
