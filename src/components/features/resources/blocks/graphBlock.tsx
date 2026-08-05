import type { GraphBlock as GraphBlockType } from '@/payload/payload-types'
import { MermaidRenderer } from './mermaidRenderer'
import { GestureWrapper } from './gestureWrapper'

interface GraphBlockProps {
  block: GraphBlockType
}

/**
 * A draw.io link can be either an image export (SVG/PNG) or a published viewer
 * link. Images render as plain <img>; viewer links need an iframe, which the
 * host must be trusted for — so only diagrams.net domains are embedded.
 */
function drawioEmbed(rawUrl: string): { kind: 'image' | 'iframe'; src: string } | null {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null

  if (/\.(svg|png|jpg|jpeg|webp)$/i.test(url.pathname)) {
    return { kind: 'image', src: url.toString() }
  }

  const host = url.hostname.replace(/^www\./, '')
  const allowed = [
    'viewer.diagrams.net',
    'app.diagrams.net',
    'embed.diagrams.net',
    'drive.google.com',
  ]
  if (allowed.includes(host)) {
    return { kind: 'iframe', src: url.toString() }
  }

  return null
}

export function GraphBlock({ block }: GraphBlockProps) {
  const { graphType, mermaidDefinition, drawioUrl, html, caption } = block
  const drawio = graphType === 'drawio' && drawioUrl ? drawioEmbed(drawioUrl) : null

  return (
    <div className="my-12 w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="w-full">
        {graphType === 'mermaid' && mermaidDefinition && (
          <MermaidRenderer definition={mermaidDefinition} />
        )}

        {graphType === 'drawio' &&
          (drawio?.kind === 'image' ? (
            <GestureWrapper>
              <img
                src={drawio.src}
                alt={caption || 'Diagram'}
                className="max-w-full h-auto"
              />
            </GestureWrapper>
          ) : drawio?.kind === 'iframe' ? (
            <iframe
              src={drawio.src}
              title={caption || 'draw.io diagram'}
              loading="lazy"
              className="h-[480px] w-full rounded-xl border border-border bg-muted/40"
            />
          ) : (
            <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
              <p className="text-sm italic text-muted-foreground">
                Add a diagram: draw it free at{' '}
                <a
                  href="https://app.diagrams.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  app.diagrams.net
                </a>
                , then paste a published link or an exported SVG/PNG URL in the CMS.
              </p>
            </div>
          ))}

        {graphType === 'chartData' && (
          <div className="bg-muted/40 p-6 rounded-xl border border-border flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground italic">Chart rendering coming soon...</p>
            {/* Future: Add Chart.js or Recharts here */}
          </div>
        )}

        {graphType === 'html' && html && (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: html graph blocks are authored by trusted CMS admins only
            dangerouslySetInnerHTML={{ __html: html }}
            className="w-full rounded-xl overflow-hidden border border-border"
          />
        )}
      </div>

      {caption && (
        <p className="text-center text-sm text-muted-foreground font-medium italic">{caption}</p>
      )}
    </div>
  )
}
