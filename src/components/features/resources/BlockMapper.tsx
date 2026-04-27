import React from 'react'
import RichTextRender from '@/components/common/RichTextRender'
import { Resource } from '@/payload/payload-types'
import { CodeBlockServer } from './blocks/CodeBlockServer'
import { ImageBlock } from './blocks/ImageBlock'
import { TableBlock } from './blocks/TableBlock'
import { GraphBlock } from './blocks/GraphBlock'
import { RowBlock } from './blocks/RowBlock'
import { SimulatorLinkBlock } from './blocks/SimulatorLinkBlock'

type Block = NonNullable<Resource['content']>[number]

export function BlockMapper({ block, index }: { block: Block; index: number }) {
  switch (block.blockType) {
    case 'textBlock':
      return (
        <section key={block.id || index} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <RichTextRender content={block.text} />
        </section>
      )
    case 'codeBlock':
      return <CodeBlockServer key={block.id || index} block={block} />
    case 'imageBlock':
      return <ImageBlock key={block.id || index} block={block} />
    case 'tableBlock':
      return <TableBlock key={block.id || index} block={block} />
    case 'graphBlock':
      return <GraphBlock key={block.id || index} block={block} />
    case 'rowBlock':
      return <RowBlock key={block.id || index} block={block} />
    case 'simulatorLinkBlock':
      return <SimulatorLinkBlock key={block.id || index} block={block} />
    default:
      return null
  }
}
