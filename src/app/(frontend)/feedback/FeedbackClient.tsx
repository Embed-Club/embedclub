'use client'

import BorderGlow from '@/components/ui/BorderGlow'
import { Clock, ExternalLink, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SectionConfig {
  id: string
  name: string
  deadlineStr: string
  deadlineDate: Date
  formUrl: string
  glowColor: string
  colors: string[]
  description: string
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'A',
    name: 'Section A - Workshop',
    description: 'Submit your feedback for the IoT Application Design Workshop (Section A).',
    deadlineStr: '27/05/2026 00:00 (IST)',
    deadlineDate: new Date('2026-05-27T00:00:00+05:30'),
    formUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScvJc2Hem4fvW8Kax_65sb4k3fUC30rAgFIzxf0GztjVWAxGg/viewform?usp=sharing&ouid=112343350609327532860',
    glowColor: '270 80 55', // Purple
    colors: ['#c084fc', '#8b5cf6', '#6366f1'],
  },
  {
    id: 'B',
    name: 'Section B - Workshop',
    description: 'Submit your feedback for the IoT Application Design Workshop (Section B).',
    deadlineStr: '26/05/2026 00:00 (IST)',
    deadlineDate: new Date('2026-05-26T00:00:00+05:30'),
    formUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScVR_A2DqFYQJMmdzd2bFAw8CaghbAVZHLt-1yaLGKkTXB6rQ/viewform?usp=sharing&ouid=112343350609327532860',
    glowColor: '330 80 55', // Rose
    colors: ['#f472b6', '#ec4899', '#db2777'],
  },
]

export default function FeedbackClient() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Sync clock to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatus = (section: SectionConfig) => {
    if (!currentTime) return { active: true, timeLeft: null }
    const difference = section.deadlineDate.getTime() - currentTime.getTime()
    if (difference <= 0) {
      return { active: false, timeLeft: null }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((difference / 1000 / 60) % 60)
    const seconds = Math.floor((difference / 1000) % 60)

    return {
      active: true,
      timeLeft: { days, hours, minutes, seconds },
    }
  }

  const handleLaunchForm = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="space-y-4">
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Access the feedback forms for the IoT Application Design Workshop. Select your designated
          section to proceed to the secure Google Form in a new tab. Please complete the feedback
          before the expiration deadline.
        </p>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SECTIONS.map((section) => {
          const status = getStatus(section)

          return (
            <div
              key={section.id}
              // biome-ignore lint/a11y/useSemanticElements: interactive grid card wrapper
              role="button"
              tabIndex={status.active ? 0 : -1}
              onClick={() => status.active && handleLaunchForm(section.formUrl)}
              onKeyDown={(e) => {
                if (status.active && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleLaunchForm(section.formUrl)
                }
              }}
              className={`cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-2xl ${
                !status.active ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01]'
              }`}
            >
              <BorderGlow
                glowColor={section.glowColor}
                colors={section.colors}
                borderRadius={16}
                glowIntensity={0.8}
                glowRadius={30}
                backgroundColor="rgba(9, 9, 11, 0.8)"
              >
                <div className="p-6 space-y-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                  {/* Decorative Background Letter */}
                  <div className="absolute right-[-10px] bottom-[-20px] text-white/5 font-black text-9xl select-none pointer-events-none">
                    {section.id}
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Embed Club
                      </span>
                      {status.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Closed
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold uppercase tracking-wide text-white">
                      {section.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {section.description}
                    </p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {/* Time Left or Closed message */}
                    {status.active ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deadline: {section.deadlineStr}</span>
                        </div>
                        {status.timeLeft && (
                          <div className="flex gap-2 text-xs font-bold text-white/90 bg-white/5 border border-white/10 rounded-lg p-2.5 max-w-fit">
                            <span>Closes in:</span>
                            {status.timeLeft.days > 0 && <span>{status.timeLeft.days}d</span>}
                            <span>{status.timeLeft.hours}h</span>
                            <span>{status.timeLeft.minutes}m</span>
                            <span>{status.timeLeft.seconds}s</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2.5 max-w-fit">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Closed since {section.deadlineStr}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {status.active ? 'Click to open Google Form' : 'No longer accepting inputs'}
                      </span>
                      {status.active && (
                        <div className="p-2 rounded-full border bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wider pl-1 pr-0.5">
                            Open
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </div>
          )
        })}
      </div>
    </div>
  )
}
