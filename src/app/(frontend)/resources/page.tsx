import { ResourcesPageContent, type ResourceCardData } from '@/app/(frontend)/resources/ResourcesPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

async function getResources(): Promise<ResourceCardData[]> {
  try {
    const payload = await getPayload({ config })

    const resources = await payload.find({
      collection: 'resources',
      depth: 1, 
      limit: 100,
      pagination: false,
    })

    if (!resources.docs || resources.docs.length === 0) {
      return []
    }

    // Transform Payload resources to ResourceCardData format
    return (resources.docs as any[]).map((resource) => {
      let imageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop' // fallback

      if (resource.thumbnail) {
        if (typeof resource.thumbnail === 'object' && resource.thumbnail !== null && 'url' in resource.thumbnail) {
          imageUrl = resource.thumbnail.url
        } else if (typeof resource.thumbnail === 'string') {
          imageUrl = `/api/media/file/${resource.thumbnail}`
        }
      }

      const tags = Array.isArray(resource.tags)
        ? resource.tags
            .map((tag: any) => (typeof tag === 'object' ? tag.name : tag))
            .filter(Boolean)
        : []

      return {
        id: resource.id,
        title: resource.title || '',
        description: resource.description || '',
        image: imageUrl,
        tags,
        category: resource.category || '',
        slug: resource.slug || '',
      }
    })
  } catch (error) {
    console.error('[Resources] Error fetching from Payload:', error)
    return []
  }
}

export default async function Page() {
  let resources: ResourceCardData[] = []

  try {
    resources = await getResources()
  } catch (error) {
    console.error('[Resources Page] Error:', error)
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl">
          RESOURCES
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ResourcesPageContent resources={resources} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
