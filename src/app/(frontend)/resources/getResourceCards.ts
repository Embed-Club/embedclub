import type { ResourceCardData } from '@/app/(frontend)/resources/resourcesPageContent'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop'

/**
 * Fetch cards for the Resources or Tutorials page. The two are separate
 * collections with an identical document shape, so one mapper serves both.
 *
 * Sorted by `_order` - the drag-arranged order from the admin list view, top
 * row first - not by date.
 */
export async function getResourceCards(
  collection: 'resources' | 'tutorials',
): Promise<ResourceCardData[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection,
      depth: 1,
      limit: 100,
      pagination: false,
      sort: '_order',
    })

    return result.docs.map((doc) => {
      let imageUrl = FALLBACK_IMAGE

      if (doc.thumbnail) {
        if (typeof doc.thumbnail === 'object' && doc.thumbnail !== null && doc.thumbnail.url) {
          imageUrl = doc.thumbnail.url
        } else if (typeof doc.thumbnail === 'number') {
          imageUrl = `/api/media/file/${doc.thumbnail}`
        }
      }

      const tags = Array.isArray(doc.tags)
        ? doc.tags
            .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
            .filter((name): name is string => Boolean(name))
        : []

      return {
        id: String(doc.id),
        title: doc.title || '',
        description: doc.description || '',
        image: imageUrl,
        tags,
        slug: doc.slug || '',
        badge: doc.badge ?? null,
        createdAt: doc.createdAt,
        difficulty: doc.difficulty || undefined,
        readTime: doc.estimatedReadTime ?? null,
      }
    })
  } catch (error) {
    console.error(`[${collection}] Error fetching from Payload:`, error)
    return []
  }
}
