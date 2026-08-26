'use client'

import { EmptyState } from '@/components/common/emptyState'
import { PageTitle } from '@/components/common/pageTitle'
import { Timeline } from '@/components/features/timeline/unifiedTimeline'
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

/** Transform PayloadCMS achievements to timeline format with configured sort order. */
function transformAchievements(
  achievements: Achievement[],
  sortOrder: 'asc' | 'desc' = 'desc',
): TimelineAchievement[] {
  const sortedAchievements = [...achievements].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
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
export function AchievementsPageContent({
  achievements,
  sortOrder = 'desc',
}: {
  achievements: Achievement[]
  sortOrder?: 'asc' | 'desc'
}) {
  const timelineAchievements = React.useMemo(
    () => transformAchievements(achievements, sortOrder),
    [achievements, sortOrder],
  )

  return (
    <>
      <PageTitle>ACHIEVEMENTS</PageTitle>

      {timelineAchievements.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center px-4">
          <EmptyState title="No Achievements Yet" />
        </div>
      ) : (
        <Timeline
          items={timelineAchievements}
          fillDistance={100}
          mobilePosition="right"
          className="w-full"
        />
      )}
    </>
  )
}
