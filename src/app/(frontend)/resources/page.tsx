import {
  type ResourceCardData,
  ResourcesPageContent,
} from '@/app/(frontend)/resources/ResourcesPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import config from '@/payload/payload.config'
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
    return (resources.docs as unknown as Record<string, unknown>[]).map((resource) => {
      // Get thumbnail URL
      let imageUrl =
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop' // fallback

      if (resource.thumbnail) {
        const thumbnail = resource.thumbnail

        // If thumbnail is an object with url property
        if (typeof thumbnail === 'object' && thumbnail !== null && 'url' in thumbnail) {
          imageUrl = (thumbnail as { url: string }).url
        }
        // If thumbnail is an ID (string), construct the API URL
        else if (typeof thumbnail === 'string') {
          imageUrl = `/api/media/file/${thumbnail}`
        }
      }

      // Get tag names
      const tags = Array.isArray(resource.tags)
        ? resource.tags
            .map((tag: unknown) => {
              if (typeof tag === 'object' && tag !== null && 'name' in tag) {
                return (tag as { name: string }).name
              }
              return typeof tag === 'string' ? tag : ''
            })
            .filter(Boolean)
        : []

      return {
        id: resource.id as string,
        title: (resource.title as string) || '',
        description: (resource.description as string) || '',
        image: imageUrl,
        tags,
        slug: (resource.slug as string) || '',
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
