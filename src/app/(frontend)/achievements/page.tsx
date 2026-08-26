import {
  type Achievement,
  AchievementsPageContent,
} from '@/app/(frontend)/achievements/achievementsPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'Milestones, wins, and highlights from Embed Club over the years.',
}

/** All achievements and sort order preference fetched via the Payload local API. */
async function getAchievementsData(): Promise<{
  achievements: Achievement[]
  sortOrder: 'asc' | 'desc'
}> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload
      .findGlobal({
        slug: 'achievement-settings',
      })
      .catch(() => null)

    const sortOrder = settings?.sortOrder === 'asc' ? 'asc' : 'desc'
    const sortParam = sortOrder === 'asc' ? 'date' : '-date'

    const res = await payload.find({
      collection: 'achievements',
      depth: 1,
      limit: 500,
      pagination: false,
      sort: sortParam,
    })
    return {
      achievements: res.docs as unknown as Achievement[],
      sortOrder,
    }
  } catch (error) {
    console.error('[Achievements] Error fetching from Payload:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const { achievements, sortOrder } = await getAchievementsData()

  return (
    <SidebarShell>
      <MainbarShell>
        <AchievementsPageContent achievements={achievements} sortOrder={sortOrder} />
      </MainbarShell>
    </SidebarShell>
  )
}
