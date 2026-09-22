import type { ResourceCardData } from '@/app/(frontend)/resources/resourcesPageContent'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * Build targets shaped as resource cards, so the Build page can reuse the
 * Resources grid, search and filters unchanged. Drag order from the admin.
 */
export async function getBuildTargetCards(): Promise<ResourceCardData[]> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'build-targets',
    depth: 1,
    limit: 100,
    pagination: false,
    sort: '_order',
  })

  return result.docs.map((doc) => {
    const thumbnail = doc.thumbnail
    const image =
      typeof thumbnail === 'object' && thumbnail !== null && thumbnail.url
        ? thumbnail.url
        : `/api/media/file/${thumbnail}`

    const tags = Array.isArray(doc.tags)
      ? doc.tags
          .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
          .filter((name): name is string => Boolean(name))
      : []

    return {
      id: String(doc.id),
      title: doc.title,
      description: doc.description,
      image,
      tags,
      slug: doc.slug,
      createdAt: doc.createdAt,
      difficulty: doc.difficulty || undefined,
    }
  })
}
