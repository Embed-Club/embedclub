import { splitHeadingIds } from '@/lib/richTextHeadings'
import type { RowBlock as RowBlockType } from '@/payload/payload-types'
import { BlockMapper } from '../blockMapper'

interface RowBlockProps {
  block: RowBlockType
  /** Anchor ids for headings inside this row, in document order. */
  headingIds?: string[]
}

export function RowBlock({ block, headingIds }: RowBlockProps) {
  const { columns, blocks } = block

  if (!blocks || blocks.length === 0) return null

  const idsPerBlock = splitHeadingIds(blocks, headingIds ?? [])

  const gridCols = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-3',
  }

  return (
    <div
      className={`grid gap-8 w-full my-12 ${gridCols[columns || '2']} animate-in fade-in slide-in-from-bottom-4 duration-500 delay-350`}
    >
      {blocks.map((subBlock, i) => (
        <div key={subBlock.id || i} className="flex flex-col">
          {/* @ts-ignore - Block types might have slight mismatches in nesting */}
          <BlockMapper block={subBlock} index={i} headingIds={idsPerBlock[i]} />
        </div>
      ))}
    </div>
  )
}
