import {
  type SimulatorCardData,
  SimulatorsPageContent,
} from '@/app/(frontend)/simulators/simulators-page-content'
import { MainbarShell, SidebarShell } from '@/components/layout/frontend-shell'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

async function getSimulators(): Promise<SimulatorCardData[]> {
  try {
    const payload = await getPayload({ config })

    const simulators = await payload.find({
      collection: 'simulators',
      depth: 1,
      limit: 100,
      pagination: false,
    })

    if (!simulators.docs || simulators.docs.length === 0) {
      return []
    }

    // Transform Payload simulators to SimulatorCardData format
    return simulators.docs.map((simulator) => {
      let imageUrl =
        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&h=300&fit=crop' // fallback

      if (simulator.thumbnail) {
        if (
          typeof simulator.thumbnail === 'object' &&
          simulator.thumbnail !== null &&
          simulator.thumbnail.url
        ) {
          imageUrl = simulator.thumbnail.url
        } else if (typeof simulator.thumbnail === 'number') {
          imageUrl = `/api/media/file/${simulator.thumbnail}`
        }
      }

      const tags = Array.isArray(simulator.tags)
        ? simulator.tags
            .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
            .filter((name): name is string => Boolean(name))
        : []

      return {
        id: String(simulator.id),
        title: simulator.title || '',
        description: simulator.description || '',
        image: imageUrl,
        tags,
        category: simulator.category || '',
        slug: simulator.slug || '',
        difficulty: simulator.difficulty || undefined,
        estimatedTime: simulator.estimatedTime ?? undefined,
        createdAt: simulator.createdAt,
      }
    })
  } catch (error) {
    console.error('[Simulators] Error fetching from Payload:', error)
    return []
  }
}

export default async function Page() {
  let simulators: SimulatorCardData[] = []

  try {
    simulators = await getSimulators()
  } catch (error) {
    console.error('[Simulators Page] Error:', error)
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          SIMULATORS
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <SimulatorsPageContent simulators={simulators} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
