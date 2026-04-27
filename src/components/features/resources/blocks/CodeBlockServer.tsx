import React from 'react'
import { CodeBlock } from '@/payload/payload-types'
import { CopyButton } from './CopyButton'
import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  block: CodeBlock
}

export async function CodeBlockServer({ block }: CodeBlockProps) {
  const { code, language, caption } = block

  let highlightedCode = ''
  try {
    highlightedCode = await codeToHtml(code, {
      lang: language || 'text',
      theme: 'github-dark',
    })
  } catch (error) {
    console.error('Shiki error:', error)
    highlightedCode = `<pre><code>${code}</code></pre>`
  }

  return (
    <div className="group relative my-8 w-full overflow-hidden rounded-xl bg-zinc-950/50 border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
          </div>
          {caption && <span className="ml-2 text-xs font-medium text-zinc-400">{caption}</span>}
          {!caption && <span className="ml-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">{language}</span>}
        </div>
        <CopyButton code={code} />
      </div>
      
      <div 
        className="p-4 overflow-x-auto text-[13px] leading-relaxed shiki-container"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      <style>{`
        .shiki-container pre {
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .shiki-container code {
          font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
      `}</style>
    </div>
  )
}
