'use client'

import { useEffect, useState } from 'react'
import * as SVGAssets from './SVGAssets'

interface InlineSVGProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Injects SVG markup directly into the DOM so it can inherit parent CSS (like @font-face).
 * Optimized to use static assets synchronously to prevent layout shifts during transitions.
 */
export function InlineSVG({ src, className, style }: InlineSVGProps) {
  // Try to get static content first for instant render
  const getInitialContent = () => {
    const s = src.toLowerCase()
    if (s.includes('banner-dark')) return SVGAssets.BANNER_DARK
    if (s.includes('banner-light')) return SVGAssets.BANNER_LIGHT
    if (s.includes('logo-dark')) return SVGAssets.LOGO_DARK
    if (s.includes('logo-light')) return SVGAssets.LOGO_LIGHT
    return null
  }

  const [content, setContent] = useState<string | null>(getInitialContent())

  useEffect(() => {
    // If we already have content from static assets, don't fetch
    if (content) return

    let cancelled = false
    fetch(src)
      .then((r) => r.text())
      .then((rawSvg) => {
        if (cancelled) return

        // Strip embedded @font-face blocks that use data: URIs (corrupted Base64)
        const cleaned = rawSvg.replace(/@font-face\s?\{[^@]*\}/g, (match) =>
          match.includes('data:') ? '' : match,
        )

        setContent(cleaned)
      })
      .catch((err) => {
        console.error('Error loading SVG:', err)
      })
    return () => { cancelled = true }
  }, [src, content])

  if (!content) return <div className={className} style={style} />

  return (
    <div
      className={className}
      style={{
        ...style,
        lineHeight: 0,
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG files are our own local assets
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
