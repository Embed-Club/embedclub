import type { CollectionAfterReadHook } from 'payload'

/**
 * Base URL of the public Supabase Storage bucket (its edge CDN), e.g.
 * `https://<ref>.supabase.co/storage/v1/object/public/media`. When set, media
 * is served straight from Supabase's CDN instead of streaming through the
 * Payload `/api/<collection>/file/<name>` route (Vercel → Sydney on every hit).
 * Unset → URLs are left untouched, so this degrades safely.
 */
const CDN_BASE = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_URL?.replace(/\/$/, '')

/** Rewrite a Payload upload route URL to the Supabase public CDN URL. */
export function toCdnUrl<T extends string | null | undefined>(url: T): T {
  if (!CDN_BASE || !url) return url
  const m = url.match(/^\/api\/[^/]+\/file\/(.+)$/)
  return (m ? `${CDN_BASE}/${m[1]}` : url) as T
}

/**
 * afterRead hook for upload collections: rewrites `url`, `thumbnailURL`, and
 * every image size URL to the Supabase CDN. Central so every consumer (SSR
 * getPayload + REST + admin) gets CDN URLs with no per-component changes.
 */
export const rewriteUploadUrls: CollectionAfterReadHook = ({ doc }) => {
  if (!doc || !CDN_BASE) return doc
  if (typeof doc.url === 'string') doc.url = toCdnUrl(doc.url)
  if (typeof doc.thumbnailURL === 'string') doc.thumbnailURL = toCdnUrl(doc.thumbnailURL)
  if (doc.sizes && typeof doc.sizes === 'object') {
    for (const key of Object.keys(doc.sizes)) {
      const size = doc.sizes[key]
      if (size && typeof size.url === 'string') size.url = toCdnUrl(size.url)
    }
  }
  return doc
}
