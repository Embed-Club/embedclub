import { memo, useCallback, useEffect, useRef, useState } from 'react'
import BorderGlow from '@/components/ui/BorderGlow'

export interface ChromaItem {
  image: string
  title: string
  subtitle: string
  handle?: string
  location?: string
  borderColor?: string
  gradient?: string
  url?: string
}

// GlowingEffect was here - removed in favor of BorderGlow
export interface ChromaGridProps {
  items?: ChromaItem[]
  className?: string
  radius?: number
  damping?: number
  fadeOut?: number
  ease?: string
}

const ChromaGrid: React.FC<ChromaGridProps> = ({ items, className = '' }) => {
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

  const handleCardClick = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
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

        const textColorClass = isLightMode ? 'text-gray-700 group-hover:text-black' : 'text-white'

        const spotlightColor = 'rgba(255,255,255,0.3)'

        return (
          <article
            // biome-ignore lint/suspicious/noArrayIndexKey: safe for fixed layout
            key={c.title + i}
            onClick={() => handleCardClick(c.url)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick(c.url)
              }
            }}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: making article clickable
            tabIndex={0}
            className="group relative flex flex-col w-full sm:w-[300px] md:w-[320px] cursor-pointer"
          >
            <BorderGlow
              borderRadius={20}
              glowRadius={40}
              glowColor={isLightMode ? '0 0 80' : '220 30 90'}
              backgroundColor={isLightMode ? 'rgb(249, 250, 251)' : 'transparent'}
              className="w-full h-full border-none shadow-none"
            >
              <div
                className={`relative z-10 flex flex-col rounded-[20px] overflow-hidden transition-all duration-300 border ${borderStyle} ${
                  isLightMode ? 'hover:bg-white' : ''
                }`}
                style={{
                  background: cardBackground,
                }}
              >
                <div className="relative z-10 flex-1 p-[10px] box-border">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-[10px] transition-all duration-300"
                  />
                </div>
                <footer
                  className={`relative z-10 p-3 font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 ${textColorClass}`}
                >
                  <h3 className="m-0 text-[1.05rem] font-semibold transition-colors duration-300">
                    {c.title}
                  </h3>
                  {c.handle && (
                    <span className="text-[0.95rem] opacity-80 text-right transition-colors duration-300">
                      {c.handle}
                    </span>
                  )}
                  <p className="m-0 text-[0.85rem] opacity-85 transition-colors duration-300">
                    {c.subtitle}
                  </p>
                  {c.location && (
                    <span className="text-[0.85rem] opacity-85 text-right transition-colors duration-300">
                      {c.location}
                    </span>
                  )}
                </footer>
              </div>
            </BorderGlow>
          </article>
        )
      })}
    </div>
  )
}

export default ChromaGrid
