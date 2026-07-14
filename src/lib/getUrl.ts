/**
 * The canonical public origin of the site, resolved server-side.
 *
 * One name to rule them all: `NEXT_PUBLIC_SITE_URL` (e.g.
 * `https://embedclub.vercel.app`). Falls back to Vercel's injected production
 * URL, then localhost for dev/build. Use this for sitemap, robots, and any
 * absolute-URL needs — do NOT reintroduce NEXT_PUBLIC_BASE_URL / NEXT_BASE_URL.
 */
export function getServerSideURL(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}
