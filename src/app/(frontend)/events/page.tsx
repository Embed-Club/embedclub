"use client";

import React from "react";
import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import { Carousel } from "@/components/EventsCarousel";
import { EventCard } from "@/components/EventsCards";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusCards } from "@/components/ui/focus-cards";
import type { Event } from "@/payload-types";

function getBaseUrl() {
  return typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Server-side fetch of events from Payload REST.
 * depth=1 expands the linked media so you get image.url directly.
 * sort=-createdAt shows the newest first.
 * next.revalidate controls ISR; bump or use { cache: "no-store" } if you need true SSR.
 */
async function getEvents(baseUrl: string) {
  const res = await fetch(
    `${baseUrl}/api/events?depth=1&sort=-createdAt&limit=5`,
    { cache: "no-store" }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch events:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      url: `${baseUrl}/api/events?depth=1&sort=-createdAt`
    });
    throw new Error(`Failed to load events: ${res.status} ${res.statusText}`);
  }
  
  const data = (await res.json()) as { docs: Event[] };
  return data.docs;
}

/**
 * Fetch all events for the gallery (with pagination support).
 */
async function getAllEvents(baseUrl: string) {
  const res = await fetch(
    `${baseUrl}/api/events?depth=1&sort=-createdAt&limit=100`,
    { cache: "no-store" }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch all events:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      url: `${baseUrl}/api/events?depth=1&sort=-createdAt`
    });
    throw new Error(`Failed to load events: ${res.status} ${res.statusText}`);
  }
  
  const data = (await res.json()) as { docs: Event[] };
  return data.docs;
}


function CarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex w-full overflow-hidden py-10 md:py-20">
      <div className="mx-auto flex w-full max-w-7xl flex-row justify-start gap-4 pl-4">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-80 w-56 rounded-3xl md:h-[40rem] md:w-96"
          />
        ))}
      </div>
    </div>
  );
}

function FocusCardsSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-10 w-full md:px-8 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-60 w-full rounded-lg md:h-96"
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [allEvents, setAllEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(9);

  React.useEffect(() => {
    let isMounted = true;
    const baseUrl = getBaseUrl();
    const minLoadingMs = 600;

    Promise.all([
      getEvents(baseUrl),
      getAllEvents(baseUrl),
      new Promise((resolve) => setTimeout(resolve, minLoadingMs)),
    ])
      .then(([eventsData, allEventsData]) => {
        if (!isMounted) return;
        setEvents(eventsData as Event[]);
        setAllEvents(allEventsData as Event[]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        if (!isMounted) return;
        setError("Failed to load events");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const updatePageSize = () => {
      setPageSize(window.innerWidth < 768 ? 6 : 9);
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [allEvents.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(allEvents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const visibleEvents = allEvents.slice(startIndex, startIndex + pageSize);

  return (
    <SidebarShell>
      <MainbarShell>
        {isLoading ? (
          <>
            <div className="absolute left-5 top-20 md:left-20 md:top-12">
              <Skeleton className="h-6 w-36 md:h-10 md:w-56" />
            </div>
            <div className="pt-24 md:pt-32">
              <CarouselSkeleton />
            </div>

            <div className="w-full px-6 pb-20 pt-20 md:px-12 lg:px-16">
              <Skeleton className="mb-6 h-5 w-32 md:h-7 md:w-44" />
              <FocusCardsSkeleton />
              <div className="mt-6 flex w-full justify-end">
                <Skeleton className="h-9 w-56" />
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <h1 className="absolute left-5 top-20 md:left-20 md:top-12 text-xl font-medium md:text-4xl">
              RECENT EENTS
            </h1>
            <div className="w-full h-full py-20">
              <Carousel
                items={events.map((event, index) => (
                  <EventCard
                    key={event.id ?? index}
                    event={event}
                    index={index}
                  />
                ))}
              />
            </div>

            <div className="w-full px-6 pb-10 pt-6 md:px-12 lg:px-16">
              <h2 className="relative text-xl font-medium md:text-4xl">
                LL EENTS
              </h2>
              {totalPages > 1 && (
                <div className="mt-6 flex w-full justify-end pb-6">
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.max(1, page - 1));
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === currentPage}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1)
                            );
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              <FocusCards
                cards={visibleEvents.map((event) => ({
                  title: event.title || "Untitled Event",
                  src:
                    typeof event.image === "string"
                      ? event.image
                      : event.image?.url || "/placeholder-event.jpg",
                  event,
                }))}
              />
              {totalPages > 1 && (
                <div className="mt-6 flex w-full justify-end">
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.max(1, page - 1));
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === currentPage}
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1)
                            );
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
            
          </>
        )}
      </MainbarShell>
    </SidebarShell>
  );
}
