'use client'

import { ResourceCards } from '@/components/features/resources/ResourceCards'
import { SearchBar } from '@/components/common/SearchBar'
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
  const [sortBy, setSortBy] = useState<string>('title')

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

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (resource) => resource.category?.toLowerCase() === selectedCategory.toLowerCase(),
      )
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        default:
          return 0
      }
    })

    return sorted
  }, [debouncedQuery, resources, selectedCategory, sortBy])

  // Get unique categories from resources (memoized)
  const categories = useMemo(
    () => Array.from(new Set(resources.map((r) => r.category).filter(Boolean))) as string[],
    [resources],
  )

  const hasSearched = debouncedQuery.trim().length > 0

  // Humorous XSS Detection
  const isXSSAttempt = useMemo(() => {
    const p = debouncedQuery.toLowerCase()
    return p.includes('<script') || 
           p.includes('alert(') || 
           p.includes('onerror=') || 
           p.includes('onload=') ||
           p.includes('javascript:') ||
           p.includes('document.cookie') ||
           p.includes('windows.location')
  }, [debouncedQuery])

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg md:text-xl text-zinc-300 mb-2">No resources yet</p>
        <p className="text-sm md:text-base text-zinc-500">
          Resources will appear here once they are added.
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
        />
      </div>

      <XSSHoneypot isDetected={isXSSAttempt} />

      {isXSSAttempt ? null : filteredResources.length === 0 && hasSearched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg md:text-xl text-zinc-400 mb-2">No resources found</p>
          <p className="text-sm md:text-base text-zinc-500">
            Try searching with different keywords or tags
          </p>
        </div>
      ) : (
        <ResourceCards resources={filteredResources} />
      )}
    </>
  )
}
