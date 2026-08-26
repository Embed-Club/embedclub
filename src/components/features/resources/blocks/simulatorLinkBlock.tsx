'use client'

import type {
  Simulator,
  SimulatorLinkBlock as SimulatorLinkBlockType,
} from '@/payload/payload-types'
import { Download, SquareArrowOutUpRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { SimulatorCardData } from '@/app/(frontend)/simulators/simulatorsPageContent'

const SimulatorModal = dynamic(() =>
  import('@/components/features/simulators/simulatorModal').then((module) => module.SimulatorModal),
)

interface SimulatorLinkBlockProps {
  block: SimulatorLinkBlockType
}

export function SimulatorLinkBlock({ block }: SimulatorLinkBlockProps) {
  const { simulator, buttonText } = block

  const [open, setOpen] = useState(false)

  if (typeof simulator !== 'object' || simulator === null) return null

  const title = simulator.title || 'Simulator'
  const card = toSimulatorCardData(simulator)
  const isDownload = card.launchType === 'download'
  const actionLabel = buttonText || (isDownload ? 'Download App' : 'Open Website')

  return (
    <div className="my-16 w-full animate-in fade-in zoom-in duration-500 delay-400">
      <div className="rounded-2xl border border-border bg-card/40 px-6 py-8 text-center md:px-10 md:py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              {isDownload ? `Get ${title}` : `Open ${title} online`}
            </h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {isDownload
                ? `Download ${title} and continue with the setup.`
                : `Open ${title} in a new tab and start experimenting.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isDownload ? (
              <Download className="h-4 w-4" />
            ) : (
              <SquareArrowOutUpRight className="h-4 w-4" />
            )}
            {actionLabel}
          </button>
        </div>
      </div>

      <SimulatorModal simulator={card} open={open} onOpenChange={setOpen} />
    </div>
  )
}

function toSimulatorCardData(simulator: Simulator): SimulatorCardData {
  const image =
    typeof simulator.thumbnail === 'object' && simulator.thumbnail !== null
      ? simulator.thumbnail.url || `/api/media/file/${simulator.thumbnail.id}`
      : `/api/media/file/${simulator.thumbnail}`

  const tags = Array.isArray(simulator.tags)
    ? simulator.tags
        .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
        .filter((name): name is string => Boolean(name))
    : []

  return {
    id: String(simulator.id),
    title: simulator.title,
    description: simulator.description,
    image,
    tags,
    slug: simulator.slug,
    difficulty: simulator.difficulty || undefined,
    estimatedTime: simulator.estimatedTime ?? undefined,
    createdAt: simulator.createdAt,
    launchUrl: simulator.launchUrl || undefined,
    launchType: simulator.launchType,
    videoUrl: simulator.videoUrl || undefined,
    content: simulator.content,
  }
}
