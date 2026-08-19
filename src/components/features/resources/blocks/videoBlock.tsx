import type { VideoBlock as VideoBlockType } from '@/payload/payload-types'

interface VideoBlockProps {
  block: VideoBlockType
}

/**
 * Pull the 11-character video id out of any YouTube URL an editor might paste.
 *
 * Covers watch links, share links (youtu.be), already-embedded urls, Shorts,
 * and live streams - asking editors to hand-extract an id is a support burden,
 * and the wrong form silently rendering nothing is worse.
 */
export function youTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null

  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    // Not a URL - accept a bare id, which is what a careful editor might paste.
    return /^[\w-]{11}$/.test(rawUrl.trim()) ? rawUrl.trim() : null
  }

  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return /^[\w-]{11}$/.test(id) ? id : null
  }

  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null
  }

  const queryId = url.searchParams.get('v')
  if (queryId && /^[\w-]{11}$/.test(queryId)) return queryId

  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
  return match ? match[1] : null
}

export function VideoBlock({ block }: VideoBlockProps) {
  const { url, caption } = block
  const videoId = youTubeId(url || '')

  if (!videoId) {
    return (
      <div className="my-12 rounded-xl border border-border bg-muted/40 p-6 text-center">
        <p className="text-sm italic text-muted-foreground">
          That doesn&apos;t look like a YouTube link - check the URL in the CMS.
        </p>
      </div>
    )
  }

  return (
    <figure className="my-12 flex w-full flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      {/* youtube-nocookie.com: no tracking cookie until the viewer actually
          hits play. Same player, fewer third-party cookies on our pages. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={caption || 'YouTube video player'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm font-medium italic text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
