import RichTextRender from '@/components/common/richTextRender'
import type {
  CodeBlock,
  GraphBlock,
  ImageBlock,
  Resource,
  RowBlock,
  SimulatorLinkBlock as SimulatorLinkBlockType,
  TableBlock,
} from '@/payload/payload-types'
import { CodeBlockServer } from './blocks/codeBlockServer'
import { GraphBlock as GraphBlockComp } from './blocks/graphBlock'
import { ImageBlock as ImageBlockComp } from './blocks/imageBlock'
import { RowBlock as RowBlockComp } from './blocks/rowBlock'
import { SimulatorLinkBlock as SimulatorLinkBlockComp } from './blocks/simulatorLinkBlock'
import { TableBlock as TableBlockComp } from './blocks/tableBlock'

type Block = NonNullable<Resource['content']>[number]

export function BlockMapper({ block, index }: { block: Block; index: number }) {
  const b = block
  switch (b.blockType) {
    case 'textBlock':
      return (
        <section
          key={b.id || index}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
        >
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
