'use client'

/**
 * Resolve a pasted video URL to something embeddable. Organizers paste whatever
 * their browser address bar shows — a YouTube watch link, a youtu.be short
 * link, a Vimeo page — none of which render in an iframe as-is.
 *
 * Returns `null` when the URL is a direct video file, which plays in a
 * `<video>` element instead.
 */
export function toEmbedUrl(rawUrl: string): string | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.pathname.startsWith('/embed/')) return url.toString()
    if (url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  }

  if (host === 'player.vimeo.com') return url.toString()

  return null
}

const DIRECT_VIDEO = /\.(mp4|webm|ogg|mov)(\?.*)?$/i

interface SimulatorVideoProps {
  url: string
  title: string
}

/** Walkthrough player shown at the top of the simulator modal. */
export function SimulatorVideo({ url, title }: SimulatorVideoProps) {
  const embedUrl = toEmbedUrl(url)

  if (embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          src={embedUrl}
          title={`${title} walkthrough`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    )
  }

  if (DIRECT_VIDEO.test(url)) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: organizer-supplied walkthrough clips have no caption track
      <video
        src={url}
        controls
        playsInline
        className="aspect-video w-full rounded-xl border border-border bg-black"
      />
    )
  }

  // Unrecognized host — don't render a broken frame, just offer the link.
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="block rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:text-primary"
    >
      Watch the walkthrough video
    </a>
  )
}
