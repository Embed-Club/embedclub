'use client'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/SimulatorsPageContent'
import { GlowingEffect } from '@/components/common/ChromaGrid'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { TagOverflow } from '../resources/TagOverflow'
import { Play } from 'lucide-react'

interface SimulatorCardProps {
  card: SimulatorCardData
  index?: number
}

export const SimulatorCard = React.memo(({ card }: SimulatorCardProps) => {
  return (
    <div
      className="group relative h-60 md:h-96 w-full cursor-pointer rounded-lg"
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
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--spotlight-color': 'rgba(255,255,255,0.2)',
        } as React.CSSProperties
      }
    >
      <GlowingEffect
        variant="default"
        glow
        spread={40}
        proximity={64}
        inactiveZone={0.01}
        disabled={false}
        borderWidth={3}
        className="z-30 rounded-lg pointer-events-none inset-[1px]"
      />

      <Link
        href={`/simulators/${card.slug}`}
        aria-label={`Open simulator: ${card.title}`}
        className={cn(
          'block h-full w-full rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden transition-all duration-300 ease-out hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black border border-white/10 group-hover:border-primary/30 z-10',
        )}
      >
        {/* Spotlight hover effect */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)',
          }}
        />

        <img
          src={card.image}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-8 w-8 fill-primary" />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-end justify-end py-6 px-4 transition-all duration-300 z-10">
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{card.category}</span>
               <span className="text-[10px] text-zinc-400">{card.estimatedTime} min</span>
            </div>
            <div className="text-sm md:text-lg font-bold text-white group-hover:text-primary transition-colors">
              {card.title}
            </div>
            <p className="text-xs text-zinc-300 mt-2 line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
              {card.description}
            </p>
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4" onClick={(e) => e.stopPropagation()}>
                {card.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] bg-white/5 text-zinc-300 border border-white/10 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
                <TagOverflow tags={card.tags} />
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
})

SimulatorCard.displayName = 'SimulatorCard'
