'use client'

import { EmptyState } from '@/components/common/emptyState'
import { FocusCards } from '@/components/common/focusCards'
import { PageTitle } from '@/components/common/pageTitle'
import { EventCard } from '@/components/features/events/eventsCards'
import { Carousel } from '@/components/features/events/eventsCarousel'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { Event } from '@/payload/payload-types'
import React from 'react'

function getEventImageUrl(event: Event): string {
  return typeof event.image === 'object' && event.image !== null && 'url' in event.image
    ? event.image.url || '/placeholder/placeholder.jpg'
    : '/placeholder/placeholder.jpg'
}

/**
 * Client presentation for the events page. Data is fetched server-side (one DB
 * hop via getPayload) and passed in - this component only owns the interactive
 * bits: responsive page size, pagination, carousel. The carousel shows the 5
 * newest; the grid paginates the full list. No second request.
 */
export function EventsPageContent({ events }: { events: Event[] }) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(9)

  React.useEffect(() => {
    const updatePageSize = () => setPageSize(window.innerWidth < 768 ? 6 : 9)
    updatePageSize()
    window.addEventListener('resize', updatePageSize)
    return () => window.removeEventListener('resize', updatePageSize)
  }, [])

  const recent = events.slice(0, 5)
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const visibleEvents = events.slice(startIndex, startIndex + pageSize)

  const pager = (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault()
              setCurrentPage((page) => Math.max(1, page - 1))
            }}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNumber = index + 1
          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={pageNumber === currentPage}
                onClick={(event) => {
                  event.preventDefault()
                  setCurrentPage(pageNumber)
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault()
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )

  return (
    <>
      {/* z-30 keeps the heading above the cards, whose root is `relative z-10` -
          without it they paint over the title wherever the two overlap. */}
      <PageTitle className="z-30">RECENT EVENTS</PageTitle>
      {/* pt-16/md:pt-32 reserves room for the absolutely-positioned heading, the
          same clearance every other listing page uses. It used to come from the
          carousel's own py-10/md:py-20, which was removed to kill the black bar. */}
      {/* No right padding on mobile: the carousel clips at its own edge, so
          padding there cuts the next card short and leaves a strip of page
          background beside it. Let the track bleed off the screen instead. */}
      <div className="w-full pl-6 pr-0 pt-16 pb-4 md:px-12 md:pt-32 md:pb-8 lg:px-16">
        {recent.length === 0 ? (
          <EmptyState title="No Events Yet" />
        ) : (
          <Carousel
            items={recent.map((event, index) => (
              <EventCard key={event.id ?? index} event={event} index={index} />
            ))}
          />
        )}
      </div>

      <div className="w-full px-6 pb-12 pt-8 md:px-12 lg:px-16 md:pb-10 md:pt-6">
        <h2 className="relative text-2xl font-bold md:text-4xl mb-8">ALL EVENTS</h2>
        {totalPages > 1 && <div className="mt-6 flex w-full justify-end pb-6">{pager}</div>}
        {events.length === 0 ? (
          <EmptyState title="No Events Yet" />
        ) : (
          <FocusCards
            cards={visibleEvents.map((event) => ({
              title: event.title || 'Untitled Event',
              src: getEventImageUrl(event),
              event,
            }))}
          />
        )}
        {totalPages > 1 && <div className="mt-6 flex w-full justify-end">{pager}</div>}
      </div>
    </>
  )
}
