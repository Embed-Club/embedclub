'use client'

import { Marquee } from '@/components/common/marquee'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import type { AboutPage } from '@/payload/payload-types'
import { ArrowUpRight, Code2, Heart, History, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function formatHost(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return rawUrl
  }
}

export interface ContributorItem {
  id?: string | null
  name: string
  role?: string | null
  url?: string | null
  description?: string | null
}

export interface HeritageSectionProps {
  legacyUrl?: string | null
  currentDevelopers?: AboutPage['currentDevelopers']
  legacyDevelopers?: AboutPage['legacyDevelopers']
  communityNote?: string | null
}

const DEFAULT_CURRENT_DEVS: ContributorItem[] = [
  {
    name: 'Rafan',
    role: 'Lead Developer',
    url: null,
    description:
      'Architected and engineered the current Embed Club website using Next.js App Router, Payload CMS, Tailwind CSS, and interactive Motion & GSAP animations.',
  },
]

const DEFAULT_LEGACY_DEVS: ContributorItem[] = [
  {
    name: 'Muhammad Azlan',
    role: 'Original Developer',
    url: 'https://github.com/azlanajju/',
    description:
      "Engineered and published the original website, pioneering the club's digital presence and creating the initial platform for project archives, workshop notes, and community updates.",
  },
]

const DEFAULT_COMMUNITY_NOTE =
  'Heartfelt gratitude to all past and present Embed Club executive members, faculty mentors, workshop leads, and student authors at P.A. College of Engineering who contributed tutorials, project documentation, and photography across both generations of the website.'

/**
 * Expands a contributor list to ensure continuous, smooth marquee scrolling
 * across all screen sizes without gaps.
 */
function expandContributors(devs: ContributorItem[]): ContributorItem[] {
  if (!devs || devs.length === 0) return []
  const count = devs.length
  const minTarget = count === 1 ? 4 : count === 2 ? 4 : count === 3 ? 6 : count

  if (count >= minTarget) return devs

  const expanded: ContributorItem[] = []
  while (expanded.length < minTarget) {
    for (const dev of devs) {
      expanded.push(dev)
      if (expanded.length >= minTarget) break
    }
  }
  return expanded
}

/**
 * Detail modal for individual developer/contributor card.
 */
function ContributorDetailModal({
  dev,
  isCurrent,
  onClose,
}: {
  dev: ContributorItem | null
  isCurrent?: boolean
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useOutsideClick(panelRef, onClose)

  useEffect(() => {
    if (!dev) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dev, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {dev && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
          style={{
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
          // biome-ignore lint/a11y/useSemanticElements: a native <dialog> is only modal via showModal()
          role="dialog"
          aria-modal="true"
          aria-label={dev.name}
        >
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 h-full w-full bg-black/80 md:backdrop-blur-lg"
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            transition={{
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              'relative z-[60] my-auto max-h-[85svh] w-full max-w-lg overflow-hidden rounded-2xl bg-card text-card-foreground md:max-h-[90svh]',
              'border border-border shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)]',
            )}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close contributor details"
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Body */}
            <div className="max-h-[85svh] overflow-y-auto p-6 sm:p-8 md:max-h-[90svh]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
                      isCurrent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCurrent ? (
                      <Code2 className="h-3.5 w-3.5" />
                    ) : (
                      <History className="h-3.5 w-3.5" />
                    )}
                    {isCurrent ? 'Current Platform · v2.0' : 'Original Platform · v1.0'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {dev.name}
                  </h2>
                  <p className="text-sm font-semibold text-primary">
                    {dev.role || (isCurrent ? 'New Website Developer' : 'Original Developer')}
                  </p>
                </div>

                {dev.description && (
                  <div className="rounded-xl border border-border/80 bg-background/50 p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dev.description}
                    </p>
                  </div>
                )}

                {dev.url && (
                  <a
                    href={dev.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <span>View Profile</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ContributorCard({
  dev,
  isCurrent,
  onSelect,
}: {
  dev: ContributorItem
  isCurrent?: boolean
  onSelect: (dev: ContributorItem, isCurrent?: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(dev, isCurrent)}
      className={cn(
        'group relative flex w-[280px] sm:w-[340px] md:w-[380px] shrink-0 cursor-pointer flex-col justify-between rounded-2xl border p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 select-none text-left',
        isCurrent
          ? 'border-primary/30 bg-card/70 hover:border-primary/60 hover:bg-primary/[0.04]'
          : 'border-border bg-card/50 hover:border-border/80 hover:bg-card/70',
      )}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              isCurrent
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground group-hover:text-foreground',
            )}
          >
            {dev.role || (isCurrent ? 'New Website Developer' : 'Original Developer')}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100">
            Details
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground">{dev.name}</h3>

        {dev.description && (
          <p className="mt-2 line-clamp-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {dev.description}
          </p>
        )}
      </div>
    </button>
  )
}

/**
 * Website Heritage & Developer Credits Section displayed on the About page.
 * Uses interactive Marquee layers for New Website Developers and Old Website Developers.
 */
export function HeritageSection({
  legacyUrl,
  currentDevelopers,
  legacyDevelopers,
  communityNote,
}: HeritageSectionProps) {
  const finalLegacyUrl =
    legacyUrl || process.env.NEXT_PUBLIC_LEGACY_WEBSITE_URL || 'https://embedclub.org/'
  const legacyHost = formatHost(finalLegacyUrl)

  const [selectedDev, setSelectedDev] = useState<{
    dev: ContributorItem
    isCurrent?: boolean
  } | null>(null)

  const handleSelect = useCallback((dev: ContributorItem, isCurrent?: boolean) => {
    setSelectedDev({ dev, isCurrent })
  }, [])

  const handleClose = useCallback(() => {
    setSelectedDev(null)
  }, [])

  const isModalOpen = selectedDev !== null

  const curDevs =
    currentDevelopers && currentDevelopers.length > 0 ? currentDevelopers : DEFAULT_CURRENT_DEVS
  const legDevs =
    legacyDevelopers && legacyDevelopers.length > 0 ? legacyDevelopers : DEFAULT_LEGACY_DEVS
  const note = communityNote || DEFAULT_COMMUNITY_NOTE

  const expandedCurDevs = expandContributors(curDevs)
  const expandedLegDevs = expandContributors(legDevs)

  return (
    <section className="my-16">
      <div className="relative my-12 overflow-hidden rounded-2xl border border-border">
        <div className="relative px-6 py-10 md:px-12 md:py-14 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-normal [-webkit-text-stroke:1.2px]">
            Website Evolution & Tribute
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg font-bold max-w-3xl mx-auto">
            Honoring the developers and community members who built and contributed to Embed Club's
            digital platforms across generations.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-10">
        {/* Layer 1: New Website Developers (v2.0) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-sm font-bold text-foreground">New Website Developers</span>
          </div>

          <div className="relative w-full overflow-hidden">
            <Marquee pauseOnHover paused={isModalOpen} repeat={4} className="[--duration:28s] py-2">
              {expandedCurDevs.map((dev, i) => (
                <ContributorCard
                  key={`cur-${dev.id ?? dev.name}-${i}`}
                  dev={dev}
                  isCurrent
                  onSelect={handleSelect}
                />
              ))}
            </Marquee>
            {/* Edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />
          </div>
        </div>

        {/* Layer 2: Old Website Developers (v1.0) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-sm font-bold text-foreground">Old Website Developers</span>
            <a
              href={finalLegacyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {legacyHost}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <div className="relative w-full overflow-hidden">
            <Marquee
              reverse
              pauseOnHover
              paused={isModalOpen}
              repeat={4}
              className="[--duration:32s] py-2"
            >
              {expandedLegDevs.map((dev, i) => (
                <ContributorCard
                  key={`leg-${dev.id ?? dev.name}-${i}`}
                  dev={dev}
                  onSelect={handleSelect}
                />
              ))}
            </Marquee>
            {/* Edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />
          </div>
        </div>
      </div>

      {/* Community Acknowledgments */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-semibold">Community & Content: </strong>
          {note}
        </p>
      </div>

      {/* Contributor Details Modal */}
      <ContributorDetailModal
        dev={selectedDev?.dev ?? null}
        isCurrent={selectedDev?.isCurrent}
        onClose={handleClose}
      />
    </section>
  )
}

export default HeritageSection
