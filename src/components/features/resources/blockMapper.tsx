import RichTextRender from '@/components/common/richTextRender'
import type {
  AccordionBlock as AccordionBlockType,
  CodeBlock,
  GraphBlock,
  ImageBlock,
  Resource,
  RowBlock,
  SimulatorLinkBlock as SimulatorLinkBlockType,
  TableBlock,
  VideoBlock,
} from '@/payload/payload-types'
import { AccordionBlock as AccordionBlockComp } from './blocks/accordionBlock'
import { CodeBlockServer } from './blocks/codeBlockServer'
import { GraphBlock as GraphBlockComp } from './blocks/graphBlock'
import { ImageBlock as ImageBlockComp } from './blocks/imageBlock'
import { RowBlock as RowBlockComp } from './blocks/rowBlock'
import { SimulatorLinkBlock as SimulatorLinkBlockComp } from './blocks/simulatorLinkBlock'
import { TableBlock as TableBlockComp } from './blocks/tableBlock'
import { VideoBlock as VideoBlockComp } from './blocks/videoBlock'

type Block = NonNullable<Resource['content']>[number]

export function BlockMapper({
  block,
  index,
  headingIds,
}: { block: Block; index: number; headingIds?: string[] }) {
  const b = block
  switch (b.blockType) {
    case 'textBlock':
      return (
        <section
          key={b.id || index}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
        >
          <RichTextRender content={b.text} headingIds={headingIds} />
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
    case 'videoBlock':
      return <VideoBlockComp key={b.id || index} block={b as VideoBlock} />
    case 'rowBlock':
      return <RowBlockComp key={b.id || index} block={b as RowBlock} headingIds={headingIds} />
    case 'accordionBlock':
      return (
        <AccordionBlockComp
          key={b.id || index}
          block={b as AccordionBlockType}
          headingIds={headingIds}
        />
      )
    case 'simulatorLinkBlock':
      return <SimulatorLinkBlockComp key={b.id || index} block={b as SimulatorLinkBlockType} />
    default:
      return null
  }
}
