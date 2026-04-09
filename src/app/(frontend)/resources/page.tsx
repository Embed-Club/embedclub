import {
  type ResourceCardData,
  ResourcesPageContent,
} from '@/app/(frontend)/resources/ResourcesPageContent'
import { MainbarShell, SidebarShell } from '@/components/FrontendShell'
import config from '@/payload.config'
import { getPayload } from 'payload'

async function getResources(): Promise<ResourceCardData[]> {
  try {
    const payload = await getPayload({ config })

    const resources = await payload.find({
      collection: 'resources',
      depth: 2, // Populate relationships like tags and thumbnail
      limit: 1000,
      pagination: false,
    })

    if (!resources.docs || resources.docs.length === 0) {
      console.log('[Resources] No resources found in database')
      return []
    }

    console.log(`[Resources] Found ${resources.docs.length} resources`)

    // Transform Payload resources to ResourceCardData format
    return resources.docs.map((resource: any) => {
      // Get thumbnail URL
      let imageUrl =
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop' // fallback

      if (resource.thumbnail) {
        const thumbnail = resource.thumbnail

        // If thumbnail is an object with url property
        if (typeof thumbnail === 'object' && thumbnail.url) {
          imageUrl = thumbnail.url
        }
        // If thumbnail is an ID (string), construct the API URL
        else if (typeof thumbnail === 'string') {
          imageUrl = `/api/media/file/${thumbnail}`
        }
      }

      // Get tag names
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
    // Silently fail and show empty state
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
