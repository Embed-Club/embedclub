'use client'

import type { ProjectCardData, TileSize } from '@/app/(frontend)/projects/projectsPageContent'
import { ProjectModal } from '@/components/features/projects/projectModal'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

/**
 * One tile in the projects showcase.
 *
 * Two shapes from the same component, because half the club's wins have no
 * photo of the build:
 *
 * - **With an image** — the photo fills the tile and the text sits over it.
 * - **Without one** — the award becomes the artwork: set large, in copper, on
 *   the flat card surface. A missing photo should read as a deliberate choice,
 *   not a hole in the grid.
 *
 * Clicking opens the same modal the grid cards used before.
 */
export const ProjectShowcaseTile = React.memo(
  ({ card, size = 1 }: { card: ProjectCardData; size?: TileSize }) => {
    const wide = size === 2
    const [open, setOpen] = React.useState(false)
    // The tile's box, so the panel can grow out of exactly this card.
    const [originRect, setOriginRect] = React.useState<DOMRect | null>(null)
    const close = React.useCallback(() => {
      setOpen(false)
      setOriginRect(null)
    }, [])
    const hasImage = Boolean(card.image)
    const meta = [card.event, card.year ? String(card.year) : null].filter(Boolean).join(' · ')

    return (
      <>
        {/* Mounted on demand: a portal per tile, open or not, cost the page
            its scroll performance. */}
        {open && <ProjectModal card={card} onClose={close} originRect={originRect} />}

        <button
          type="button"
          onClick={(e) => {
            setOriginRect(e.currentTarget.getBoundingClientRect())
            setOpen(true)
          }}
          aria-label={`Open project: ${card.title}`}
          className={cn(
            'group/tile relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 text-left md:p-6',
            'transition-colors duration-200 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            hasImage && 'justify-end p-0',
            // Hidden, not unmounted: the panel morphs out of this tile's box, so
            // leaving a copy underneath reads as duplication. Keeps its grid space.
            open && 'opacity-0',
          )}
        >
          {hasImage && card.image && (
            <>
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes={wide ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 1024px) 100vw, 33vw'}
                className="object-cover transition-transform duration-500 group-hover/tile:scale-105"
              />
              {/* Legibility scrim, not decoration: the text sits on the photo. */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </>
          )}

          <div
            className={cn('relative flex h-full flex-col', hasImage && 'justify-end p-5 md:p-6')}
          >
            {card.award ? (
              <p
                className={cn(
                  'font-bold uppercase leading-[1.05] tracking-tight text-primary',
                  // Without a photo the award carries the tile, so it is set
                  // much larger — that is the whole idea of the type-led tile.
                  hasImage
                    ? 'text-sm tracking-widest'
                    : wide
                      ? 'text-3xl md:text-5xl'
                      : 'text-2xl md:text-3xl',
                )}
              >
                {card.award}
              </p>
            ) : null}

            {meta && (
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-widest text-muted-foreground',
                  card.award ? 'mt-2' : '',
                )}
              >
                {meta}
              </p>
            )}

            <h3
              className={cn(
                'font-semibold leading-snug text-foreground transition-colors group-hover/tile:text-primary',
                'mt-auto pt-6',
                wide ? 'text-xl md:text-2xl' : 'text-lg',
              )}
            >
              {card.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {card.teamNames.length > 0 ? card.teamNames.join(', ') : card.description}
            </p>

            <span className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover/tile:border-primary group-hover/tile:bg-primary group-hover/tile:text-primary-foreground">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </>
    )
  },
)

ProjectShowcaseTile.displayName = 'ProjectShowcaseTile'
