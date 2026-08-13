'use client'

import {
  CutoutCardInsetLabel,
  CutoutCorner,
  cutoutCardSurfaceShadowClassName,
} from '@/components/common/cutoutCard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import type React from 'react'
import { useState } from 'react'

export interface MasonryItem {
  id: string
  img: string
  url: string
  height: number
  width: number
  caption?: string
}

interface MasonryProps {
  items: MasonryItem[]
}

/**
 * True column masonry: a CSS multi-column flow. Each photo keeps its natural
 * aspect ratio, so tall and wide images pack into whatever column has room —
 * they land wherever they fit, never forced into a uniform grid. Every photo
 * is a cutout card (notched corners + inset caption strip) and the image —
 * not the card — zooms on hover.
 */
function MasonryCard({ item, index }: { item: MasonryItem; index: number }) {
  const [loaded, setLoaded] = useState(false)
  const reduceMotion = useReducedMotion()
  const aspectRatio = item.width > 0 && item.height > 0 ? item.width / item.height : 1

  return (
    <motion.div
      className="mb-4 break-inside-avoid"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: (index % 8) * 0.04 }}
    >
      <button
        type="button"
        onClick={() => window.open(item.url, '_blank', 'noopener')}
        className={cn(
          'group/cutout relative block w-full cursor-pointer overflow-hidden rounded-2xl bg-card p-0 outline-none',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        <div className="relative w-full" style={{ aspectRatio }}>
          <img
            src={item.img}
            alt={item.caption || ''}
            aria-hidden={!item.caption}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
          />
          {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
        </div>

        {item.caption && (
          <CutoutCardInsetLabel className="bottom-0 left-0 max-w-[85%] rounded-tr-[16px] bg-card px-4 py-2.5 text-left">
            <span className="block text-sm font-medium normal-case text-foreground line-clamp-2">
              {item.caption}
            </span>
            <CutoutCorner className="absolute -right-[27px] -bottom-px rotate-90 text-card" />
            <CutoutCorner className="absolute -top-[27px] -left-px rotate-90 text-card" />
          </CutoutCardInsetLabel>
        )}
      </button>
    </motion.div>
  )
}

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {items.map((item, index) => (
        <MasonryCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}

export default Masonry
