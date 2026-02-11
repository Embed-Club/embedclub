'use client'

import React from 'react'
import { SidebarShell, MainbarShell } from '@/components/FrontendShell'
import { ScrollTimeline } from '@/components/ScrollTimeline'
import { AchievementsTimeline } from '@/components/MobileTimelineItem'
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

/**
 * Transform achievements for mobile timeline
 */
function transformAchievementsForMobile(achievements: Achievement[]) {
  // Sort by date descending (newest first)
  const sortedAchievements = [...achievements].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })

  return sortedAchievements.map((achievement) => {
    const description = extractTextFromLexical(achievement.summary)
    let imageUrl: string | undefined = undefined
    
    if (achievement.image && typeof achievement.image === 'object' && 'url' in achievement.image) {
      imageUrl = achievement.image.url || undefined
    }

    return {
      id: achievement.id.toString(),
      title: achievement.title,
      description,
      imageUrl,
      date: achievement.date,
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
  const items = isMobile ? 4 : 5

  return (
    <div className="h-full w-full overflow-hidden p-6 lg:p-10">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-6">
        {Array.from({ length: items }).map((_, index) => (
          <div
            key={`achievement-skeleton-${index}`}
            className={`rounded-lg border border-border/60 bg-card/60 shadow-sm ${
              isMobile ? 'p-4' : 'p-6'
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className={`rounded-full ${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
              <Skeleton className={`${isMobile ? 'h-6 w-40' : 'h-5 w-48'}`} />
            </div>
            <div className="space-y-3">
              <Skeleton className={`w-full ${isMobile ? 'h-5' : 'h-4'}`} />
              <Skeleton className={`${isMobile ? 'h-5 w-11/12' : 'h-4 w-11/12'}`} />
              <Skeleton className={`${isMobile ? 'h-5 w-9/12' : 'h-4 w-5/6'}`} />
            </div>
            <Skeleton className={`mt-6 w-full rounded-md ${isMobile ? 'h-48' : 'h-40'}`} />
          </div>
        ))}
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

  // Transform data based on the view type
  const timelineAchievements = React.useMemo(
    () => transformAchievements(achievements),
    [achievements]
  )
  const mobileAchievements = React.useMemo(
    () => transformAchievementsForMobile(achievements),
    [achievements]
  )

  return (
    <SidebarShell>
      <MainbarShell>
        {/* Mobile heading only - desktop heading is inside ScrollTimeline */}
        {isMobile && (
          isLoading ? (
            <Skeleton className="absolute left-5 top-24 h-7 w-48 md:left-5 md:top-10" />
          ) : (
            <h1 className="absolute left-5 top-20 md:left-20 md:top-12 text-xl font-medium  md:text-4xl">
              CHIEEENTS
            </h1>
          )
        )}
        <div className={isMobile ? "pt-10 md:pt-32" : ""}>
          {isLoading ? (
          <AchievementsSkeleton isMobile={isMobile} />
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive">{error}</p>
          </div>
        ) : isMobile ? (
          <AchievementsTimeline 
            achievements={mobileAchievements} 
            position="right" 
            fillDistance={100}
            className="w-full"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <ScrollTimeline achievements={timelineAchievements} />
          </div>
        )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}