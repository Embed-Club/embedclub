import { getServerSideURL } from '@/lib/getUrl'
import config from '@/payload/payload.config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

// Regenerate alongside the ISR pages.
export const revalidate = 60

const STATIC_ROUTES = [
  '',
  '/about',
  '/events',
  '/achievements',
  '/gallery',
  '/members',
  '/resources',
  '/tutorials',
  '/simulators',
  '/feedback',
  '/contact',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))

  try {
    const payload = await getPayload({ config })

    const resources = await payload.find({
      collection: 'resources',
      depth: 0,
      limit: 500,
      pagination: false,
      select: { slug: true, updatedAt: true },
    })

    // Both resources and tutorials render their detail pages under /resources/[slug].
    // (Forms are intentionally excluded - they're noindex, single-use pages.)
    for (const r of resources.docs) {
      if (!r.slug) continue
      entries.push({
        url: `${base}/resources/${r.slug}`,
        lastModified: r.updatedAt ? new Date(r.updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('[Sitemap] Error enumerating dynamic routes:', error)
  }

  return entries
}
