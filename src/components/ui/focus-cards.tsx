"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { X, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { useOutsideClick } from "@/hooks/use-outside-click";
import Image from "next/image";
import RichTextRender from "@/components/RichTextRender";
import type { Event } from "@/payload-types";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [expandedImage, setExpandedImage] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageModalRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen();
        } else if (expandedImage) {
          setExpandedImage(false);
          setZoomLevel(1);
        } else {
          setSelectedCard(null);
        }
      }
    }

    if (selectedCard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCard, expandedImage, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useOutsideClick(containerRef, () => {
    if (!expandedImage) {
      setSelectedCard(null);
    }
  });

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

      <AnimatePresence>
        {selectedCard && selectedCard.event && (
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
              className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
            >
              <button
                className="sticky top-4 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white"
                onClick={() => setSelectedCard(null)}
              >
                <X className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
              </button>
              
              <div className="space-y-6 text-neutral-800 dark:text-neutral-100">
                {/* Event Title */}
                <h2 className="text-3xl font-bold">{selectedCard.event.title}</h2>

                {/* Event Poster/Image */}
                {selectedCard.event.image && typeof selectedCard.event.image === "object" && selectedCard.event.image.url && (
                  <div 
                    className="relative h-64 w-full overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setExpandedImage(true)}
                  >
                    <Image
                      src={selectedCard.event.image.url}
                      alt={selectedCard.event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Full Event Description */}
                {selectedCard.event.description && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">About this Event</h3>
                    <RichTextRender content={selectedCard.event.description} />
                  </div>
                )}

                {/* Event Details Box */}
                {(selectedCard.event.venue?.roomName ||
                  selectedCard.event.venue?.floor ||
                  selectedCard.event.contact?.email ||
                  selectedCard.event.contact?.phone) && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <h3 className="mb-3 text-lg font-semibold">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      {selectedCard.event.venue?.roomName && (
                        <div className="flex gap-2">
                          <span className="font-medium">Room/Hall:</span>
                          <span>{selectedCard.event.venue.roomName}</span>
                        </div>
                      )}
                      {selectedCard.event.venue?.floor && (
                        <div className="flex gap-2">
                          <span className="font-medium">Floor:</span>
                          <span>{selectedCard.event.venue.floor}</span>
                        </div>
                      )}
                      {selectedCard.event.contact?.phone && (
                        <div className="flex gap-2">
                          <span className="font-medium">Phone:</span>
                          <a
                            href={`tel:${selectedCard.event.contact.phone}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {selectedCard.event.contact.phone}
                          </a>
                        </div>
                      )}
                      {selectedCard.event.contact?.email && (
                        <div className="flex gap-2">
                          <span className="font-medium">Email:</span>
                          <a
                            href={`mailto:${selectedCard.event.contact.email}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {selectedCard.event.contact.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Map Section */}
                {selectedCard.event.location?.coords?.lat && selectedCard.event.location?.coords?.lng && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Location</h3>
                    {selectedCard.event.location.address && (
                      <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedCard.event.location.address}
                      </p>
                    )}
                    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <iframe
                        width="100%"
                        height="300"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedCard.event.location.coords.lng - 0.01},${selectedCard.event.location.coords.lat - 0.01},${selectedCard.event.location.coords.lng + 0.01},${selectedCard.event.location.coords.lat + 0.01}&layer=mapnik&marker=${selectedCard.event.location.coords.lat},${selectedCard.event.location.coords.lng}`}
                        allowFullScreen
                      ></iframe>
                      <div className="bg-neutral-100 p-2 text-center dark:bg-neutral-800">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${selectedCard.event.location.coords.lat}&mlon=${selectedCard.event.location.coords.lng}&zoom=${selectedCard.event.location.zoom || 15}`}
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
      </AnimatePresence>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && selectedCard && selectedCard.event?.image && typeof selectedCard.event.image === "object" && selectedCard.event.image.url && (
          <div 
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 overflow-auto" 
            ref={fullscreenContainerRef}
            onClick={() => {
              setExpandedImage(false);
              setZoomLevel(1);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm"
              onClick={() => {
                setExpandedImage(false);
                setZoomLevel(1);
              }}
            />
            
            {/* Close Button - Fixed top right */}
            <button
              className="fixed top-4 right-4 z-[90] flex h-10 w-10 items-center justify-center rounded-full bg-black/70 hover:bg-black/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImage(false);
                setZoomLevel(1);
              }}
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              ref={imageModalRef}
              className="relative z-[80] flex-1 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedCard.event.image.url}
                alt={selectedCard.event.title}
                className="object-contain rounded-lg transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  maxHeight: 'calc(100vh - 120px)',
                  maxWidth: '90vw',
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
    </>
  );
}
