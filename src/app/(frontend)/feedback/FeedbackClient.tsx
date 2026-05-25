'use client'

import BorderGlow from '@/components/ui/BorderGlow'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Clock, ExternalLink, FileText, Loader2, Lock } from 'lucide-react'
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
    name: 'Section A - Feedback',
    description: 'Submit your end-term academic feedback for Section A courses.',
    deadlineStr: '27/05/2026 00:00 (IST)',
    deadlineDate: new Date('2026-05-27T00:00:00+05:30'),
    formUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScvJc2Hem4fvW8Kax_65sb4k3fUC30rAgFIzxf0GztjVWAxGg/viewform?usp=sharing&ouid=112343350609327532860',
    glowColor: '270 80 55', // Purple
    colors: ['#c084fc', '#8b5cf6', '#6366f1'],
  },
  {
    id: 'B',
    name: 'Section B - Feedback',
    description: 'Submit your end-term academic feedback for Section B courses.',
    deadlineStr: '26/05/2026 00:00 (IST)',
    deadlineDate: new Date('2026-05-26T00:00:00+05:30'),
    formUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLScVR_A2DqFYQJMmdzd2bFAw8CaghbAVZHLt-1yaLGKkTXB6rQ/viewform?usp=sharing&ouid=112343350609327532860',
    glowColor: '330 80 55', // Rose
    colors: ['#f472b6', '#ec4899', '#db2777'],
  },
]

export default function FeedbackClient() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [loadingForm, setLoadingForm] = useState<boolean>(false)
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

  const handleSelectSection = (id: string) => {
    setSelectedSection(selectedSection === id ? null : id)
    setLoadingForm(true)
  }

  const activeSectionObj = SECTIONS.find((s) => s.id === selectedSection)
  const activeSectionStatus = activeSectionObj ? getStatus(activeSectionObj) : null

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="space-y-4">
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Access your classroom evaluation forms. Select your designated academic section to
          proceed. Please make sure to complete the feedback before the expiration deadline.
        </p>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SECTIONS.map((section) => {
          const status = getStatus(section)
          const isSelected = selectedSection === section.id

          return (
            <div
              key={section.id}
              // biome-ignore lint/a11y/useSemanticElements: interactive grid card wrapper
              role="button"
              tabIndex={status.active ? 0 : -1}
              onClick={() => status.active && handleSelectSection(section.id)}
              onKeyDown={(e) => {
                if (status.active && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleSelectSection(section.id)
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
                glowIntensity={isSelected ? 1.5 : 0.8}
                glowRadius={isSelected ? 50 : 30}
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
                        {status.active ? 'Click to fill feedback' : 'No longer accepting inputs'}
                      </span>
                      {status.active && (
                        <div
                          className={`p-2 rounded-full border transition-all duration-300 ${
                            isSelected
                              ? 'bg-white text-black border-white'
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-300 ${
                              isSelected ? 'rotate-90' : ''
                            }`}
                          />
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

      {/* Selected Google Form Display Section */}
      <AnimatePresence mode="wait">
        {selectedSection && activeSectionObj && (
          <motion.div
            key={selectedSection}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 pt-6 border-t border-white/5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    selectedSection === 'A'
                      ? 'bg-violet-500/10 border border-violet-500/20'
                      : 'bg-rose-500/10 border border-rose-500/20'
                  }`}
                >
                  <FileText
                    className={`w-6 h-6 ${
                      selectedSection === 'A' ? 'text-violet-400' : 'text-rose-400'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                    {activeSectionObj.name} Form
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Complete the questions in the embedded view below, or launch the form in a new
                    window.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(activeSectionObj.formUrl, '_blank', 'noopener,noreferrer')
                  }}
                  className="bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium text-xs rounded-full py-1.5 px-4 h-9 tracking-wide uppercase inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </Button>

                <Button
                  onClick={() => setSelectedSection(null)}
                  className="bg-white hover:bg-white/90 text-black font-bold text-xs rounded-full py-1.5 px-4 h-9 tracking-wide uppercase"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Check Live Expiration again inside dynamic area */}
            {activeSectionStatus?.active ? (
              <div className="relative w-full aspect-[4/5] md:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c0e] shadow-2xl">
                {loadingForm && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30 space-y-4">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <p className="text-sm text-zinc-400 animate-pulse font-mono tracking-widest uppercase">
                      Loading Google Form...
                    </p>
                  </div>
                )}
                <iframe
                  src={activeSectionObj.formUrl}
                  className="absolute inset-0 w-full h-full border-0 z-20"
                  title={`${activeSectionObj.name} Google Form`}
                  onLoad={() => setLoadingForm(false)}
                >
                  Loading…
                </iframe>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 rounded-2xl bg-white/5 space-y-4">
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                    Form Expired
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Feedback submission for this section was only allowed until{' '}
                    {activeSectionObj.deadlineStr}. The time limit has expired and responses are no
                    longer being collected.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
