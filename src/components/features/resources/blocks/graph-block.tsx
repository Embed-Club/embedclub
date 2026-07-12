import type { GraphBlock as GraphBlockType } from '@/payload/payload-types'
import { MermaidRenderer } from './mermaid-renderer'

interface GraphBlockProps {
  block: GraphBlockType
}

export function GraphBlock({ block }: GraphBlockProps) {
  const { graphType, mermaidDefinition, html, caption } = block

  return (
    <div className="my-12 w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="w-full">
        {graphType === 'mermaid' && mermaidDefinition && (
          <MermaidRenderer definition={mermaidDefinition} />
        )}

        {graphType === 'chartData' && (
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 flex items-center justify-center min-h-[300px]">
            <p className="text-zinc-500 italic">Chart rendering coming soon...</p>
            {/* Future: Add Chart.js or Recharts here */}
          </div>
        )}

        {graphType === 'html' && html && (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: html graph blocks are authored by trusted CMS admins only
            dangerouslySetInnerHTML={{ __html: html }}
            className="w-full rounded-xl overflow-hidden border border-white/5"
          />
        )}
      </div>

      {caption && <p className="text-center text-sm text-zinc-500 font-medium italic">{caption}</p>}
    </div>
  )
}
