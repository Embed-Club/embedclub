'use client'

import { SearchBar } from '@/components/common/SearchBar'
import { SimulatorCards } from '@/components/features/simulators/SimulatorCards'
import { useEffect, useMemo, useState } from 'react'

export interface SimulatorCardData {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  category?: string
  slug: string
  difficulty?: string
  estimatedTime?: number
}

interface SimulatorsPageContentProps {
  simulators?: SimulatorCardData[]
}

export function SimulatorsPageContent({ simulators = [] }: SimulatorsPageContentProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('relevant')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

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
        const categoryText = simulator.category ? simulator.category.toLowerCase() : ''
        const haystack =
          `${simulator.title} ${simulator.description} ${tagsText} ${categoryText}`.toLowerCase()
        return haystack.includes(normalized)
      })
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((simulator) =>
        selectedTags.every((tag) => simulator.tags.includes(tag)),
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (simulator) => simulator.category?.toLowerCase() === selectedCategory.toLowerCase(),
      )
    }

    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((simulator) => {
        const date = (simulator as any).createdAt ? new Date((simulator as any).createdAt) : null
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
          return (
            new Date((b as any).createdAt || 0).getTime() -
            new Date((a as any).createdAt || 0).getTime()
          )
        default:
          return 0
      }
    })

    return sorted
  }, [debouncedQuery, simulators, selectedCategory, sortBy, selectedTags, dateRange])

  const categories = useMemo(
    () => Array.from(new Set(simulators.map((r) => r.category).filter(Boolean))) as string[],
    [simulators],
  )

  const activeTags = useMemo(
    () => Array.from(new Set(simulators.flatMap((r) => r.tags))).filter(Boolean) as string[],
    [simulators],
  )

  const hasSearched =
    debouncedQuery.trim().length > 0 || selectedTags.length > 0 || selectedCategory !== 'all'

  if (simulators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          No Simulators Available
        </p>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
          We're experiencing a temporary issue loading simulators. Please refresh the page or try
          again in a few moments.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex w-full flex-col gap-4 items-center md:flex-row md:gap-3 md:mb-10 md:justify-center transition-all duration-200">
        <SearchBar
          className="w-full md:max-w-xl"
          placeholders={[
            'Search simulators...',
            'Try: UART, SPI, Oscilloscope...',
            'Search by tag or category...',
          ]}
          onChange={(event) => setQuery(event.target.value)}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
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
        <SimulatorCards simulators={filteredSimulators} />
      )}
    </>
  )
}
