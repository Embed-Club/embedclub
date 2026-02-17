'use client'

import React from 'react'
import { SidebarShell, MainbarShell } from '@/components/FrontendShell'
import { Timeline } from '@/components/UnifiedTimeline'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'

type Achievement = {
  id: number
  title: string
  summary: {
    root: {
      children: Array<{
        text?: string
        children?: Array<{ text?: string; [key: string]: any }>
        [key: string]: any
      }>
      [key: string]: any
    }
    [key: string]: any
  }
  date: string
  image?:
    | (number | null)
    | {
        id: number
        url?: string | null
        [key: string]: any
      }
}

type TimelineAchievement = {
  id: string
  title: string
  text: string
  image: string | null
}

/**
 * Extract plain text from Lexical rich text structure
 */
function extractTextFromLexical(summary: Achievement['summary']): string {
  if (!summary?.root?.children) return ''

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  return summary.root.children.map(extractText).join(' ').trim()
}

/**
 * Transform PayloadCMS achievements to timeline format
 */
function transformAchievements(achievements: Achievement[]): TimelineAchievement[] {
  // Sort by date descending (newest first) as a safety measure
  // This ensures achievements are always displayed with the latest date at the top
  const sortedAchievements = [...achievements].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    // Descending order: newest dates (larger timestamps) come first
    return dateB - dateA
  })

  return sortedAchievements.map((achievement) => {
    // Extract text from lexical rich text
    const text = extractTextFromLexical(achievement.summary)

    // Get image URL from relationship
    let imageUrl: string | null = null
    if (achievement.image && typeof achievement.image === 'object' && 'url' in achievement.image) {
      imageUrl = achievement.image.url || null
    }

    return {
      id: achievement.id.toString(),
      title: achievement.title,
      text,
      image: imageUrl,
    }
  })
}

async function fetchAchievements(): Promise<Achievement[]> {
  // Build an absolute URL for client-side fetch
  const base =
    typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || 'http://localhost:3000'
  const url = new URL('/api/achievements', base)
  // Use Payload REST `sort` param: prefix with - to sort descending (newest first)
  url.searchParams.set('depth', '1')
  url.searchParams.set('sort', '-date') // Sort by date descending: newest achievements first

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to load achievements')
  }
  const json = await res.json()
  return json.docs as Achievement[]
}

function AchievementsSkeleton({ isMobile }: { isMobile: boolean }) {
  const items = 4
  const barPositionClass = isMobile
    ? 'right-[16px] translate-x-1/2'
    : 'left-1/2 -translate-x-1/2'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute left-5 top-5 md:left-20 md:top-12 z-10">
        <Skeleton className="h-6 w-40 md:h-8 md:w-56" />
      </div>

      <div className={`relative h-full w-full ${isMobile ? 'pt-16 pb-12' : 'pt-24 pb-24'}`}>
        <div className={`absolute top-0 bottom-20 w-3 pointer-events-none ${barPositionClass}`}>
          <div className="absolute top-0 bottom-0 w-full rounded-full border-2 border-foreground/40 dark:border-white/40 bg-transparent" />
        </div>

        <div className={`relative ${isMobile ? 'space-y-10 px-4' : 'space-y-16 px-8'}`}>
          {Array.from({ length: items }).map((_, index) => {
            const isLeft = index % 2 === 0

            if (isMobile) {
              return (
                <div key={`achievement-skeleton-${index}`} className="relative">
                  <div className="flex items-start gap-2 flex-row-reverse pr-0 pl-2">
                    <div className="flex-shrink-0 w-[32px]" />
                    <div className="flex-1 max-w-[92%]">
                      <div className="rounded-lg border border-border/60 bg-card/60 shadow-sm p-4">
                        <div className="mb-4 flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-11/12" />
                          <Skeleton className="h-4 w-9/12" />
                        </div>
                        <Skeleton className="mt-6 h-44 w-full rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={`achievement-skeleton-${index}`} className="flex items-center gap-16 px-8 max-w-7xl mx-auto">
                <div className="flex-1">
                  {isLeft ? (
                    <div className="rounded-lg border border-border/60 bg-card/60 shadow-sm p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-40 w-full rounded-lg" />
                  )}
                </div>

                <div className="w-0" />

                <div className="flex-1">
                  {!isLeft ? (
                    <div className="rounded-lg border border-border/60 bg-card/60 shadow-sm p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-40 w-full rounded-lg" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const isMobile = useIsMobile()
  const [achievements, setAchievements] = React.useState<Achievement[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch achievements on component mount
  React.useEffect(() => {
    fetchAchievements()
      .then((data) => {
        setAchievements(data)
        setIsLoading(false)
      })
      .catch(() => {
        setError('Failed to load achievements')
        setIsLoading(false)
      })
  }, [])

  // Transform data for unified timeline
  const timelineAchievements = React.useMemo(
    () => transformAchievements(achievements),
    [achievements]
  )

  return (
    <SidebarShell>
      <MainbarShell>
        {/* Mobile heading only - desktop heading is inside Timeline component */}
        {isMobile && !isLoading && (
          <h1 className="absolute left-5 top-5 text-2xl font-medium md:text-5xl">
            CHIEEENTS
          </h1>
        )}
        
        {isLoading ? (
          <AchievementsSkeleton isMobile={isMobile} />
        ) : error ? (
          <>
            {!isMobile && (
              <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-5xl">
                CHIEEENTS
              </h1>
            )}
            <div className="flex h-full w-full flex-col items-center justify-center gap-6">
              <img
                src="/placeholder/NoNetwork.svg"
                alt="No network"
                className="h-40 w-40 md:h-56 md:w-56 dark:invert"
              />
              <div className="text-center">
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  No network
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Failed to load achievements right now.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className={isMobile ? "w-full h-full" : "absolute inset-0"}>
            <Timeline
              items={timelineAchievements}
              fillDistance={100}
              showHeader={!isMobile}
              headerText="CHIEEENTS"
              mobilePosition="right"
              className="w-full h-full"
            />
          </div>
        )}
      </MainbarShell>
    </SidebarShell>
  )
}