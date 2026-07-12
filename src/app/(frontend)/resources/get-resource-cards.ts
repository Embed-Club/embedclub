import type { ResourceCardData } from '@/app/(frontend)/resources/resources-page-content'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * Fetch resources as card data. `type: 'tutorial'` feeds the Tutorials page;
 * `type: 'resource'` feeds Resources (older rows with no type count as resources).
 */
export async function getResourceCards(type: 'resource' | 'tutorial'): Promise<ResourceCardData[]> {
  try {
    const payload = await getPayload({ config })

    const resources = await payload.find({
      collection: 'resources',
      depth: 1,
      limit: 100,
      pagination: false,
      sort: '-createdAt',
      where:
        type === 'tutorial'
          ? { type: { equals: 'tutorial' } }
          : { type: { not_equals: 'tutorial' } },
    })

    return resources.docs.map((resource) => {
      let imageUrl =
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop' // fallback

      if (resource.thumbnail) {
        if (
          typeof resource.thumbnail === 'object' &&
          resource.thumbnail !== null &&
          resource.thumbnail.url
        ) {
          imageUrl = resource.thumbnail.url
        } else if (typeof resource.thumbnail === 'number') {
          imageUrl = `/api/media/file/${resource.thumbnail}`
        }
      }

      const tags = Array.isArray(resource.tags)
        ? resource.tags
            .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
            .filter((name): name is string => Boolean(name))
        : []

      return {
        id: String(resource.id),
        title: resource.title || '',
        description: resource.description || '',
        image: imageUrl,
        tags,
        slug: resource.slug || '',
        badge: resource.badge ?? null,
        createdAt: resource.createdAt,
        difficulty: resource.difficulty || undefined,
        readTime: resource.estimatedReadTime ?? null,
      }
    })
  } catch (error) {
    console.error('[Resources] Error fetching from Payload:', error)
    return []
  }
}
