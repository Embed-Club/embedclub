import React from 'react'
import RichTextRender from '@/components/common/RichTextRender'
import { Resource, CodeBlock, ImageBlock, TableBlock, GraphBlock, RowBlock, SimulatorLinkBlock as SimulatorLinkBlockType, TextBlock } from '@/payload/payload-types'
import { CodeBlockServer } from './blocks/CodeBlockServer'
import { ImageBlock as ImageBlockComp } from './blocks/ImageBlock'
import { TableBlock as TableBlockComp } from './blocks/TableBlock'
import { GraphBlock as GraphBlockComp } from './blocks/GraphBlock'
import { RowBlock as RowBlockComp } from './blocks/RowBlock'
import { SimulatorLinkBlock as SimulatorLinkBlockComp } from './blocks/SimulatorLinkBlock'

type Block = NonNullable<Resource['content']>[number]

export function BlockMapper({ block, index }: { block: any; index: number }) {
  const b = block as Block
  switch (b.blockType) {
    case 'textBlock':
      return (
        <section key={b.id || index} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <RichTextRender content={b.text} />
        </section>
      )
    case 'codeBlock':
      return <CodeBlockServer key={b.id || index} block={b as CodeBlock} />
    case 'imageBlock':
      return <ImageBlockComp key={b.id || index} block={b as ImageBlock} />
    case 'tableBlock':
      return <TableBlockComp key={b.id || index} block={b as TableBlock} />
    case 'graphBlock':
      return <GraphBlockComp key={b.id || index} block={b as GraphBlock} />
    case 'rowBlock':
      return <RowBlockComp key={b.id || index} block={b as RowBlock} />
    case 'simulatorLinkBlock':
      return <SimulatorLinkBlockComp key={b.id || index} block={b as SimulatorLinkBlockType} />
    default:
      return null
  }
}
