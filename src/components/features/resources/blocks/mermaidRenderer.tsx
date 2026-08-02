'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useRef, useState } from 'react'

interface MermaidRendererProps {
  definition: string
}

export function MermaidRenderer({ definition }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'
  // useId can contain characters invalid in DOM ids used by mermaid internals
  const diagramId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false

    // Dynamic import keeps mermaid (~1.5MB gzipped) out of the shared bundle;
    // it only loads on pages that actually render a diagram.
    import('mermaid').then(async ({ default: mermaid }) => {
      if (cancelled) return

      // Copper primary in both themes; the neutrals flip so diagrams stay
      // legible in light mode instead of rendering dark-on-light.
      mermaid.initialize({
        startOnLoad: false,
        theme: isLight ? 'default' : 'dark',
        securityLevel: 'strict',
        themeVariables: isLight
          ? {
              primaryColor: '#d98e4a',
              primaryTextColor: '#1c1917',
              primaryBorderColor: '#b8763a',
              lineColor: '#a1a1aa',
              secondaryColor: '#f4f4f5',
              tertiaryColor: '#e4e4e7',
            }
          : {
              primaryColor: '#d98e4a',
              primaryTextColor: '#fff',
              primaryBorderColor: '#d98e4a',
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
    // `isLight` is a dependency so toggling the theme re-renders the SVG —
    // mermaid bakes colours into the markup at render time.
  }, [definition, diagramId, isLight])

  if (error) {
    return (
      <div className="bg-muted/40 p-6 rounded-xl border border-border text-center">
        <p className="text-muted-foreground italic text-sm">
          Unable to render diagram — check the Mermaid syntax in the CMS.
        </p>
      </div>
    )
  }

  return (
    <div
      className="bg-muted/40 p-6 rounded-xl border border-border overflow-x-auto flex justify-center"
      ref={containerRef}
    />
  )
}
