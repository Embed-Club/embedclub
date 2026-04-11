'use client'

import { useEffect, useState } from 'react'

interface InlineSVGProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Fetches an SVG file and renders it inline in the DOM.
 * This is required so that @font-face rules embedded in the SVG's <style>
 * are actually applied — <img> tags sandbox SVG resources and ignore embedded fonts.
 */
export function InlineSVG({ src, className, style }: InlineSVGProps) {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src)
      .then((r) => r.text())
      .then((rawSvg) => {
        if (cancelled) return

        // Strip embedded @font-face blocks from the SVG's own <style> section.
        // The Base64-encoded font data inside the SVG may be incomplete/corrupted
        // (causing missing glyphs like the "O" in Gobold). By removing it, the
        // inline SVG inherits the @font-face declarations in globals.css which
        // load from the actual .otf files on disk.
        //
        // We target specifically @font-face rules that use data: URIs (base64 embedded).
        // The style block looks like: @font-face { ... src: url(data:font/...) ... }
        // We replace the entire style element content to wipe all embedded fonts cleanly.
        const cleaned = rawSvg
          // Remove all data:-URI @font-face declarations (handles nested parens in base64 blobs)
          .replace(/@font-face\{[^@]*/g, (match) =>
            match.includes('data:') ? '' : match,
          )

        setContent(cleaned)
      })
      .catch(() => {/* silently fail – fallback is an empty div */})
    return () => { cancelled = true }
  }, [src])

  if (!content) return <div className={className} style={style} />

  return (
    <div
      className={className}
      style={{
        ...style,
        lineHeight: 0,
        // Make the inner <svg> element fill this wrapper div
      }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG files are our own local assets
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
