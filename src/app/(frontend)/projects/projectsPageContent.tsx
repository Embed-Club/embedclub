'use client'

import { EmptyState } from '@/components/common/emptyState'
import { SearchBar } from '@/components/common/searchBar'
import { ProjectCutoutCard } from '@/components/features/projects/projectCutoutCard'
import { useEffect, useMemo, useState } from 'react'

export interface ProjectCardData {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  slug: string
  status: string
  teamCount: number
  createdAt?: string
}

const STATUS_FILTERS = ['Planned', 'In Progress', 'Completed']
const STATUS_VALUES: Record<string, string> = {
  Planned: 'planned',
  'In Progress': 'inProgress',
  Completed: 'completed',
}

interface ProjectsPageContentProps {
  projects?: ProjectCardData[]
}

export function ProjectsPageContent({ projects = [] }: ProjectsPageContentProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('relevant')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const filteredProjects = useMemo(() => {
    let filtered = projects

    const normalized = debouncedQuery.trim().toLowerCase()
    if (normalized) {
      filtered = filtered.filter((project) => {
        const tagsText = project.tags.join(' ').toLowerCase()
        const haystack = `${project.title} ${project.description} ${tagsText}`.toLowerCase()
        return haystack.includes(normalized)
      })
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((project) =>
        selectedTags.every((tag) => project.tags.includes(tag)),
      )
    }

    // The category control doubles as a status filter here
    if (selectedStatus !== 'all') {
      const value = STATUS_VALUES[selectedStatus]
      filtered = filtered.filter((project) => project.status === value)
    }

    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((project) => {
        const date = project.createdAt ? new Date(project.createdAt) : null
        if (!date) return true
        if (dateRange.from && date < dateRange.from) return false
        if (dateRange.to && date > dateRange.to) return false
        return true
      })
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
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
  }, [debouncedQuery, projects, selectedStatus, sortBy, selectedTags, dateRange])

  const activeTags = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.tags))).filter(Boolean) as string[],
    [projects],
  )

  const hasSearched =
    debouncedQuery.trim().length > 0 || selectedTags.length > 0 || selectedStatus !== 'all'

  if (projects.length === 0) {
    return <EmptyState title="No Projects Yet" />
  }

  return (
    <>
      <div className="mb-6 flex w-full flex-col gap-4 items-center md:flex-row md:gap-3 md:mb-10 md:justify-center transition-all duration-200">
        <SearchBar
          className="w-full md:max-w-xl"
          placeholders={[
            'Search projects...',
            'Try: robot, PCB, IoT...',
            'Search by tag or status...',
          ]}
          onChange={(event) => setQuery(event.target.value)}
          categories={STATUS_FILTERS}
          selectedCategory={selectedStatus}
          onCategoryChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeTags={activeTags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          onDateRangeChange={setDateRange}
        />
      </div>

      {filteredProjects.length === 0 && hasSearched ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No Results Found
          </p>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
            Try searching with different keywords or tags
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full">
            {filteredProjects.map((project) => (
              <ProjectCutoutCard key={project.id} card={project} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
