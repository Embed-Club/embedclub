/**
 * Turn a pasted link into something the resource page can embed.
 *
 * Editors paste whatever their address bar shows - a YouTube watch link, a
 * Drive "share" link, a bare PDF URL, a docs site. Few of those render inside
 * an iframe as-is (Drive's `/view` sends X-Frame-Options, YouTube's watch page
 * refuses to be framed), so each provider gets its own rewrite here. The same
 * resolver drives the admin live preview, the public page, and the
 * "Open in ..." button, so a new provider is a one-place change.
 */

export type ExternalResourceKind =
  | 'youtube'
  | 'vimeo'
  | 'driveFile'
  | 'driveFolder'
  | 'pdf'
  | 'website'

export interface ExternalResource {
  kind: ExternalResourceKind
  /** URL to put in the iframe `src`. */
  embedUrl: string
  /** Where the "Open in ..." button sends people - usually the original link. */
  openUrl: string
  /** Button label, e.g. "Open in YouTube". */
  openLabel: string
  /** Aspect ratio class for the frame - videos are 16:9, documents are tall. */
  frame: 'video' | 'document'
}

const YOUTUBE_ID = /^[\w-]{11}$/
const DRIVE_ID = /^[\w-]{20,}$/

function youTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return YOUTUBE_ID.test(id) ? id : null
  }

  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') {
    return null
  }

  const queryId = url.searchParams.get('v')
  if (queryId && YOUTUBE_ID.test(queryId)) return queryId

  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/)
  return match ? match[1] : null
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

  const id = url.pathname.split('/').filter(Boolean).pop() ?? ''
  return /^\d+$/.test(id) ? id : null
}

function driveFileId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'drive.google.com' && host !== 'docs.google.com') return null

  // https://drive.google.com/file/d/<id>/view?usp=sharing
  const pathMatch = url.pathname.match(/^\/file\/d\/([\w-]+)/)
  if (pathMatch && DRIVE_ID.test(pathMatch[1])) return pathMatch[1]

  // https://drive.google.com/open?id=<id>  and  /uc?id=<id>
  const queryId = url.searchParams.get('id')
  if ((url.pathname === '/open' || url.pathname === '/uc') && queryId && DRIVE_ID.test(queryId)) {
    return queryId
  }

  return null
}

function driveFolderId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'drive.google.com') return null

  const match = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)/)
  return match && DRIVE_ID.test(match[1]) ? match[1] : null
}

/**
 * Resolve a raw link. Returns `null` when the text is not a URL at all, so
 * callers can show a "check the link" message instead of a broken frame.
 */
export function resolveExternalResource(
  rawUrl: string | null | undefined,
): ExternalResource | null {
  if (!rawUrl) return null

  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const openUrl = url.toString()

  const yt = youTubeId(url)
  if (yt) {
    return {
      kind: 'youtube',
      // youtube-nocookie: no tracking cookie until the viewer actually hits
      // play. Same player, fewer third-party cookies on our pages.
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
      openUrl: `https://www.youtube.com/watch?v=${yt}`,
      openLabel: 'Open in YouTube',
      frame: 'video',
    }
  }

  const vimeo = vimeoId(url)
  if (vimeo) {
    return {
      kind: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      openUrl: `https://vimeo.com/${vimeo}`,
      openLabel: 'Open in Vimeo',
      frame: 'video',
    }
  }

  const folder = driveFolderId(url)
  if (folder) {
    return {
      kind: 'driveFolder',
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${folder}#list`,
      openUrl: `https://drive.google.com/drive/folders/${folder}`,
      openLabel: 'Open in Google Drive',
      frame: 'document',
    }
  }

  const file = driveFileId(url)
  if (file) {
    return {
      kind: 'driveFile',
      // `/view` refuses to be framed; `/preview` is the same viewer built for it.
      embedUrl: `https://drive.google.com/file/d/${file}/preview`,
      openUrl: `https://drive.google.com/file/d/${file}/view`,
      openLabel: 'Open in Google Drive',
      frame: 'document',
    }
  }

  if (/\.pdf$/i.test(url.pathname)) {
    return {
      kind: 'pdf',
      embedUrl: openUrl,
      openUrl,
      openLabel: 'Open PDF',
      frame: 'document',
    }
  }

  return {
    kind: 'website',
    embedUrl: openUrl,
    openUrl,
    openLabel: 'Open Website',
    frame: 'document',
  }
}
