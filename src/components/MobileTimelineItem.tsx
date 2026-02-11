'use client'

import {
  Timeline,
  TimelineItem,
  TimelineNode,
  TimelineContent,
  TimelineCard,
  TimelineTitle,
  TimelineDescription,
  TimelineImage,
} from './ui/TimelineMobile'

// ============================================================================
// Types
// ============================================================================

export interface Achievement {
  id: string
  title: string
  description: string
  imageUrl?: string
  date?: string
}

export interface AchievementsTimelineProps {
  achievements: Achievement[]
  position?: 'left' | 'right'
  fillDistance?: number
  className?: string
}

// ============================================================================
// AchievementsTimeline Component
// ============================================================================

export function AchievementsTimeline({
  achievements,
  position = 'right',
  fillDistance = 100,
  className = '',
}: AchievementsTimelineProps) {
  return (
    <Timeline items={achievements} position={position} fillDistance={fillDistance} className={className}>
      {(achievement, index) => (
        <TimelineItem index={index}>
          <TimelineNode index={index} />
          <TimelineContent index={index}>
            <TimelineCard>
              <TimelineTitle>{achievement.title}</TimelineTitle>
              <TimelineDescription>{achievement.description}</TimelineDescription>
              {achievement.imageUrl && <TimelineImage src={achievement.imageUrl} alt={achievement.title} />}
            </TimelineCard>
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  )
}