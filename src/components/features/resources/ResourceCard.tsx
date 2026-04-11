import { GlowingEffect } from '@/components/common/ChromaGrid'
import type { ResourceCardData } from '@/app/(frontend)/resources/ResourcesPageContent'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

interface ResourceCardProps {
  card: ResourceCardData
  index?: number
}

export const ResourceCard = React.memo(({ card }: ResourceCardProps) => {
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
        style={{
            '--mouse-x': '50%',
            '--mouse-y': '50%',
            '--spotlight-color': 'rgba(255,255,255,0.2)',
        } as React.CSSProperties}
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
            href={`/resources/${card.slug}`}
            aria-label={`Open resource: ${card.title}`}
            className={cn(
                'block h-full w-full rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden transition-all duration-300 ease-out hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black border border-white/10 group-hover:border-white/20 z-10',
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
                className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex flex-col items-end justify-end py-4 px-4 transition-all duration-300 z-10">
                <div className="w-full">
                <div className="text-sm md:text-base font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                    {card.title}
                </div>
                <p className="text-xs md:text-sm text-gray-200 mt-2 line-clamp-2">{card.description}</p>
                {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                    {card.tags.slice(0, 2).map((tag) => (
                        <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-500/50 text-white rounded-full"
                        >
                        {tag}
                        </span>
                    ))}
                    </div>
                )}
                </div>
            </div>
        </Link>
    </div>
  )
})


ResourceCard.displayName = 'ResourceCard'
