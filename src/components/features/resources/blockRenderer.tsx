import { collectHeadings, splitHeadingIds } from '@/lib/richTextHeadings'
import type { Resource } from '@/payload/payload-types'
import { BlockMapper } from './blockMapper'

type Block = NonNullable<Resource['content']>[number]

interface BlockRendererProps {
  blocks: Block[]
  /**
   * Anchor ids for the headings inside these blocks, in document order. Omit at
   * the top level and they're minted here; RowBlock passes its own slice down.
   */
  headingIds?: string[]
}

export function BlockRenderer({ blocks, headingIds }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null

  const ids = headingIds ?? collectHeadings(blocks).map((heading) => heading.id)
  const idsPerBlock = splitHeadingIds(blocks, ids)

  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto px-4">
      {blocks.map((block, index) => (
        <BlockMapper
          key={block.id || index}
          block={block}
          index={index}
          headingIds={idsPerBlock[index]}
        />
      ))}
    </div>
  )
}
