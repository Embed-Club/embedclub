'use client'

import { SearchBar } from '@/components/common/SearchBar'
import { ResourceCards } from '@/components/features/resources/ResourceCards'
import { XSSHoneypot } from '@/components/features/resources/XSSHoneypot'
import { useEffect, useMemo, useState } from 'react'

export interface ResourceCardData {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  category?: string
  slug: string
}

interface ResourcesPageContentProps {
  resources?: ResourceCardData[]
}

export function ResourcesPageContent({ resources = [] }: ResourcesPageContentProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('relevant')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Debounce: wait 300ms after user stops typing before updating the filtered query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  const filteredResources = useMemo(() => {
    let filtered = resources

    // Text search filter
    const normalized = debouncedQuery.trim().toLowerCase()
    if (normalized) {
      filtered = filtered.filter((resource) => {
        const tagsText = resource.tags.join(' ').toLowerCase()
        const categoryText = resource.category ? resource.category.toLowerCase() : ''
        const haystack =
          `${resource.title} ${resource.description} ${tagsText} ${categoryText}`.toLowerCase()
        return haystack.includes(normalized)
      })
    }

    // Tag filter (AND logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((resource) =>
        selectedTags.every((tag) => resource.tags.includes(tag)),
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (resource) => resource.category?.toLowerCase() === selectedCategory.toLowerCase(),
      )
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((resource) => {
        // Assuming resource has createdAt, if not we skip
        const date = (resource as any).createdAt ? new Date((resource as any).createdAt) : null
        if (!date) return true
        if (dateRange.from && date < dateRange.from) return false
        if (dateRange.to && date > dateRange.to) return false
        return true
      })
    }

    // Sorting
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
  }, [debouncedQuery, resources, selectedCategory, sortBy, selectedTags, dateRange])

  // Get unique categories from resources (memoized)
  const categories = useMemo(
    () => Array.from(new Set(resources.map((r) => r.category).filter(Boolean))) as string[],
    [resources],
  )

  const activeTags = useMemo(
    () => Array.from(new Set(resources.flatMap((r) => r.tags))).filter(Boolean) as string[],
    [resources],
  )

  const hasSearched =
    debouncedQuery.trim().length > 0 || selectedTags.length > 0 || selectedCategory !== 'all'

  // Humorous XSS Detection
  const isXSSAttempt = useMemo(() => {
    const p = debouncedQuery.toLowerCase()
    return (
      p.includes('<script') ||
      p.includes('alert(') ||
      p.includes('onerror=') ||
      p.includes('onload=') ||
      p.includes('javascript:') ||
      p.includes('document.cookie') ||
      p.includes('windows.location')
    )
  }, [debouncedQuery])

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          No Resources Available
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          We're experiencing a temporary issue loading resources. Please refresh the page or try
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
            'Search resources...',
            'Try: Python, IoT, Linux...',
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

      <XSSHoneypot isDetected={isXSSAttempt} />

      {isXSSAttempt ? null : filteredResources.length === 0 && hasSearched ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            No Results Found
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            Try adjusting your search filters or using different keywords
          </p>
        </div>
      ) : (
        <ResourceCards resources={filteredResources} />
      )}
    </>
  )
}
