'use client'

import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidRendererProps {
  definition: string
}

export function MermaidRenderer({ definition }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#0070f3',
        primaryTextColor: '#fff',
        primaryBorderColor: '#0070f3',
        lineColor: '#52525b',
        secondaryColor: '#18181b',
        tertiaryColor: '#27272a',
      }
    })

    if (containerRef.current) {
      mermaid.contentLoaded()
    }
  }, [definition])

  return (
    <div className="mermaid bg-zinc-900/50 p-6 rounded-xl border border-white/5 overflow-x-auto flex justify-center" ref={containerRef}>
      {definition}
    </div>
  )
}
