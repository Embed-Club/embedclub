import React from 'react'
import { Resource } from '@/payload/payload-types'
import { BlockMapper } from './BlockMapper'

type Block = NonNullable<Resource['content']>[number]

interface BlockRendererProps {
  blocks: Block[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto px-4">
      {blocks.map((block, index) => (
        <BlockMapper key={block.id || index} block={block} index={index} />
      ))}
    </div>
  )
}
