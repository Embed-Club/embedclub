import { getServerSideURL } from '@/lib/getUrl'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the Payload admin + REST/GraphQL API out of the index.
      disallow: ['/admin', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
