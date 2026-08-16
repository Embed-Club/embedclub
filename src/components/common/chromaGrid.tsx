import { CutoutCorner } from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import type React from 'react'
import { useEffect, useState } from 'react'

export interface ChromaItem {
  /** Identifies the source record, so a click can look up the full document. */
  id?: string
  image: string
  title: string
  subtitle: string
  handle?: string
  location?: string
  borderColor?: string
  gradient?: string
  url?: string
}

export interface ChromaGridProps {
  items?: ChromaItem[]
  className?: string
  radius?: number
  damping?: number
  fadeOut?: number
  ease?: string
  /** Receives the card's on-screen box so a modal can expand out of it. */
  onItemClick?: (item: ChromaItem, originRect?: DOMRect) => void
  /** Id of the item whose modal is open — that card steps aside for it. */
  activeId?: string | null
}

const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = '',
  onItemClick,
  activeId,
}) => {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect mobile screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const updateMobile = () => setIsMobile(mq.matches)
    updateMobile()
    mq.addEventListener('change', updateMobile)

    return () => mq.removeEventListener('change', updateMobile)
  }, [])

  const currentTheme = mounted ? resolvedTheme || theme : 'dark'
  const isLightMode = currentTheme === 'light'

  const demo: ChromaItem[] = [
    {
      image: 'https://i.pravatar.cc/300?img=8',
      title: 'Alex Rivera',
      subtitle: 'Full Stack Developer',
      handle: '@alexrivera',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg,#4F46E5,#000)',
      url: 'https://github.com/',
    },
    {
      image: 'https://i.pravatar.cc/300?img=11',
      title: 'Jordan Chen',
      subtitle: 'DevOps Engineer',
      handle: '@jordanchen',
      borderColor: '#10B981',
      gradient: 'linear-gradient(210deg,#10B981,#000)',
      url: 'https://linkedin.com/in/',
    },
    {
      image: 'https://i.pravatar.cc/300?img=3',
      title: 'Morgan Blake',
      subtitle: 'UI/UX Designer',
      handle: '@morganblake',
      borderColor: '#F59E0B',
      gradient: 'linear-gradient(165deg,#F59E0B,#000)',
      url: 'https://dribbble.com/',
    },
    {
      image: 'https://i.pravatar.cc/300?img=16',
      title: 'Casey Park',
      subtitle: 'Data Scientist',
      handle: '@caseypark',
      borderColor: '#EF4444',
      gradient: 'linear-gradient(195deg,#EF4444,#000)',
      url: 'https://kaggle.com/',
    },
    {
      image: 'https://i.pravatar.cc/300?img=25',
      title: 'Sam Kim',
      subtitle: 'Mobile Developer',
      handle: '@thesamkim',
      borderColor: '#8B5CF6',
      gradient: 'linear-gradient(225deg,#8B5CF6,#000)',
      url: 'https://github.com/',
    },
    {
      image: 'https://i.pravatar.cc/300?img=60',
      title: 'Tyler Rodriguez',
      subtitle: 'Cloud Architect',
      handle: '@tylerrod',
      borderColor: '#06B6D4',
      gradient: 'linear-gradient(135deg,#06B6D4,#000)',
      url: 'https://aws.amazon.com/',
    },
  ]

  const data = items?.length ? items : demo

  const handleCardClick = (item: ChromaItem, el?: HTMLElement) => {
    if (onItemClick) {
      onItemClick(item, el?.getBoundingClientRect())
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={`relative w-full flex flex-wrap justify-center items-start gap-3 ${className}`}>
      {data.map((c, i) => {
        // Theme-aware card styling
        const cardBackground = isLightMode
          ? 'rgb(249, 250, 251)' // Very light grey for light mode
          : c.gradient

        const borderStyle = isLightMode
          ? 'border-gray-300/40 hover:border-gray-400/60'
          : 'border-white/15 hover:border-white/30'

        const spotlightColor = 'rgba(255,255,255,0.3)'

        return (
          <article
            // biome-ignore lint/suspicious/noArrayIndexKey: safe for fixed layout
            key={c.title + i}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              ;(e.currentTarget as HTMLElement).style.setProperty(
                '--mouse-x',
                `${e.clientX - rect.left}px`,
              )
              ;(e.currentTarget as HTMLElement).style.setProperty(
                '--mouse-y',
                `${e.clientY - rect.top}px`,
              )
            }}
            onClick={(e) => handleCardClick(c, e.currentTarget as HTMLElement)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick(c, e.currentTarget as HTMLElement)
              }
            }}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: making article clickable
            tabIndex={0}
            className={cn(
              'group relative flex flex-col w-full sm:w-[300px] md:w-[320px] cursor-pointer',
              // Hidden, not unmounted: the panel morphs out of this card's box,
              // so leaving a copy of it sitting underneath reads as duplication.
              // Kept in the layout so the grid does not reflow around the gap.
              c.id && c.id === activeId && 'opacity-0',
            )}
            style={
              {
                '--mouse-x': '50%',
                '--mouse-y': '50%',
                '--spotlight-color': spotlightColor,
              } as React.CSSProperties
            }
          >
            <div
              className={`relative z-10 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border ${borderStyle}`}
              style={{
                background: cardBackground,
              }}
            >
              {/* Spotlight hover effect - inherited from parent chroma context */}
              {!isMobile && (
                <div
                  className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)',
                  }}
                />
              )}

              <div className="relative z-10 aspect-[4/5] w-full">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
                />

                {/* Cutout inset label — name + role(s) */}
                <div className="absolute bottom-0 left-0 z-30 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-2.5">
                  <h3 className="m-0 truncate text-[1rem] font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <p className="m-0 line-clamp-1 text-[0.8rem] text-muted-foreground">
                    {c.subtitle}
                  </p>
                  <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
                  <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
                </div>

                {/* Batch years pin */}
                {c.handle && (
                  <span className="absolute top-0 right-0 z-30 rounded-bl-[16px] bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                    {c.handle}
                    <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-card" />
                    <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-card" />
                  </span>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default ChromaGrid
