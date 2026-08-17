'use client'

import { EmptyState } from '@/components/common/emptyState'
import { SearchBar } from '@/components/common/searchBar'
import { SimulatorCards } from '@/components/features/simulators/simulatorCards'
import type { Simulator } from '@/payload/payload-types'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'

// The modal (Dialog primitive + BlockRenderer's rich-content renderer + the
// video-embed resolver) is real weight that only matters after a card is
// clicked — most visitors browse without opening one. Loading it on demand
// keeps that weight out of every /simulators page load.
const SimulatorModal = dynamic(() =>
  import('@/components/features/simulators/simulatorModal').then((m) => m.SimulatorModal),
)

export interface SimulatorCardData {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  slug: string
  difficulty?: string
  estimatedTime?: number
  createdAt?: string
  /** Where the simulator itself lives — opened from the modal. */
  launchUrl?: string
  /** Optional walkthrough video played inside the modal. */
  videoUrl?: string
  /** Optional "how to use" blocks rendered under the video. */
  content?: Simulator['content']
}

interface SimulatorsPageContentProps {
  simulators?: SimulatorCardData[]
}

export function SimulatorsPageContent({ simulators = [] }: SimulatorsPageContentProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('relevant')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [activeSimulator, setActiveSimulator] = useState<SimulatorCardData | null>(null)
  // The clicked card's box, so the panel can grow out of exactly that card.
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  const openSimulator = useCallback((card: SimulatorCardData, rect?: DOMRect) => {
    setOriginRect(rect ?? null)
    setActiveSimulator(card)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const filteredSimulators = useMemo(() => {
    let filtered = simulators

    const normalized = debouncedQuery.trim().toLowerCase()
    if (normalized) {
      filtered = filtered.filter((simulator) => {
        const tagsText = simulator.tags.join(' ').toLowerCase()
        const haystack = `${simulator.title} ${simulator.description} ${tagsText}`.toLowerCase()
        return haystack.includes(normalized)
      })
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((simulator) =>
        selectedTags.every((tag) => simulator.tags.includes(tag)),
      )
    }

    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((simulator) => {
        const date = simulator.createdAt ? new Date(simulator.createdAt) : null
        if (!date) return true
        if (dateRange.from && date < dateRange.from) return false
        if (dateRange.to && date > dateRange.to) return false
        return true
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'relevant':
          if (normalized) {
            const aTitle = a.title.toLowerCase()
            const bTitle = b.title.toLowerCase()
            const aPos = aTitle.indexOf(normalized)
            const bPos = bTitle.indexOf(normalized)
            if (aPos !== bPos) {
              if (aPos === -1) return 1
              if (bPos === -1) return -1
              return aPos - bPos
            }
          }
          return 0
        case 'title':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [debouncedQuery, simulators, sortBy, selectedTags, dateRange])

  const activeTags = useMemo(
    () => Array.from(new Set(simulators.flatMap((r) => r.tags))).filter(Boolean) as string[],
    [simulators],
  )

  const hasSearched = debouncedQuery.trim().length > 0 || selectedTags.length > 0

  if (simulators.length === 0) {
    return <EmptyState title="No Simulators Yet" />
  }

  return (
    <>
      <div className="mb-6 flex w-full flex-col gap-4 items-center md:flex-row md:gap-3 md:mb-10 md:justify-center transition-all duration-200">
        <SearchBar
          className="w-full md:max-w-xl"
          placeholders={[
            'Search simulators...',
            'Try: UART, SPI, Oscilloscope...',
            'Search by tag...',
          ]}
          onChange={(event) => setQuery(event.target.value)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeTags={activeTags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          onDateRangeChange={setDateRange}
        />
      </div>

      {filteredSimulators.length === 0 && hasSearched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No Results Found
          </p>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
            Try searching with different keywords or tags
          </p>
        </div>
      ) : (
        <SimulatorCards
          simulators={filteredSimulators}
          onOpen={openSimulator}
          activeId={activeSimulator?.id ?? null}
        />
      )}

      <SimulatorModal
        simulator={activeSimulator}
        open={activeSimulator !== null}
        originRect={originRect}
        onOpenChange={(next) => {
          if (!next) {
            setActiveSimulator(null)
            setOriginRect(null)
          }
        }}
      />
    </>
  )
}
