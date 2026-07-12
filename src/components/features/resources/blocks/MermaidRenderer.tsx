'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface MermaidRendererProps {
  definition: string
}

export function MermaidRenderer({ definition }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  // useId can contain characters invalid in DOM ids used by mermaid internals
  const diagramId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false

    // Dynamic import keeps mermaid (~1.5MB gzipped) out of the shared bundle;
    // it only loads on pages that actually render a diagram.
    import('mermaid').then(async ({ default: mermaid }) => {
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        themeVariables: {
          primaryColor: '#0070f3',
          primaryTextColor: '#fff',
          primaryBorderColor: '#0070f3',
          lineColor: '#52525b',
          secondaryColor: '#18181b',
          tertiaryColor: '#27272a',
        },
      })

      try {
        const { svg } = await mermaid.render(diagramId, definition)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error('[Mermaid] Failed to render diagram:', err)
        if (!cancelled) setError(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [definition, diagramId])

  if (error) {
    return (
      <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 text-center">
        <p className="text-zinc-500 italic text-sm">Unable to render diagram.</p>
      </div>
    )
  }

  return (
    <div
      className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 overflow-x-auto flex justify-center"
      ref={containerRef}
    />
  )
}
