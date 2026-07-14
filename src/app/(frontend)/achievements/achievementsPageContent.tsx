'use client'

import { EmptyState } from '@/components/common/emptyState'
import { Timeline } from '@/components/features/timeline/unifiedTimeline'
import { useIsMobile } from '@/hooks/useMobile'
import React from 'react'

export type Achievement = {
  id: number
  title: string
  summary: {
    root: {
      children: Array<{
        text?: string
        children?: Array<{ text?: string; [key: string]: unknown }>
        [key: string]: unknown
      }>
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  date: string
  image?:
    | (number | null)
    | {
        id: number
        url?: string | null
        [key: string]: unknown
      }
}

type TimelineAchievement = {
  id: string
  title: string
  text: string
  image: string | null
}

/** Extract plain text from Lexical rich text structure. */
function extractTextFromLexical(summary: Achievement['summary']): string {
  if (!summary?.root?.children) return ''

  const extractText = (node: Record<string, unknown>): string => {
    if (typeof node === 'string') return node
    if (node.text) return node.text as string
    if (node.children && Array.isArray(node.children)) {
      return (node.children as Record<string, unknown>[])
        .map((child: Record<string, unknown>) => extractText(child))
        .join('')
    }
    return ''
  }

  return (summary.root.children as Record<string, unknown>[])
    .map((child: Record<string, unknown>) => extractText(child))
    .join(' ')
    .trim()
}

/** Transform PayloadCMS achievements to timeline format (newest first). */
function transformAchievements(achievements: Achievement[]): TimelineAchievement[] {
  const sortedAchievements = [...achievements].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })

  return sortedAchievements.map((achievement) => {
    const text = extractTextFromLexical(achievement.summary)

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
 * Client presentation for the achievements page. Data is fetched server-side
 * and passed in; this component owns the responsive timeline rendering.
 */
export function AchievementsPageContent({ achievements }: { achievements: Achievement[] }) {
  const isMobile = useIsMobile()
  const timelineAchievements = React.useMemo(
    () => transformAchievements(achievements),
    [achievements],
  )

  return (
    <>
      {/* Achievements timeline drives its own scroll — suppress the outer
          scroll-container scrollbar on every viewport so none ever shows. */}
      <style jsx global>{`
        [data-scroll-container] {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        [data-scroll-container]::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Mobile heading only - desktop heading is inside Timeline component */}
      {isMobile && (
        <h1 className="absolute left-5 top-5 text-2xl font-medium md:text-5xl">CHIEEENTS</h1>
      )}

      {timelineAchievements.length === 0 ? (
        <>
          {!isMobile && (
            <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-5xl">
              CHIEEENTS
            </h1>
          )}
          <div className="flex h-full w-full items-center justify-center px-4">
            <EmptyState title="No Achievements Yet" />
          </div>
        </>
      ) : (
        <div className={isMobile ? 'w-full h-full' : 'absolute inset-0'}>
          <Timeline
            items={timelineAchievements}
            fillDistance={100}
            showHeader={!isMobile}
            headerText="CHIEEENTS"
            mobilePosition="right"
            className="w-full h-full"
          />
        </div>
      )}
    </>
  )
}
