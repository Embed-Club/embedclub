import { resolveExternalResource } from '@/lib/externalResource'
import { ExternalLink } from 'lucide-react'

interface ExternalResourceFrameProps {
  url: string
  title: string
}

/**
 * Body of a linked resource: the embedded file, video or site, with an
 * "Open in ..." button pinned to the top-right so people can leave the frame
 * for the real thing (full-screen PDF reader, YouTube comments, a site that
 * refuses to be framed).
 */
export function ExternalResourceFrame({ url, title }: ExternalResourceFrameProps) {
  const resolved = resolveExternalResource(url)

  if (!resolved) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
        <p className="text-sm italic text-muted-foreground">
          This resource links somewhere we could not read - check the link in the CMS.
        </p>
      </div>
    )
  }

  const frameClass =
    resolved.frame === 'video'
      ? 'aspect-video'
      : 'aspect-[3/4] sm:aspect-[4/3] lg:aspect-auto lg:h-[80vh]'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <a
          href={resolved.openUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {resolved.openLabel}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-border bg-black ${frameClass}`}
      >
        <iframe
          src={resolved.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  )
}
