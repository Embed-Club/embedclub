import { EventsPageContent } from '@/app/(frontend)/events/eventsPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Event } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events',
  description: 'Workshops, builds, and events run by Embed Club at PA College of Engineering.',
}

/** All events, newest first, fetched once via the Payload local API. */
async function getEvents(): Promise<Event[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'events',
      depth: 1,
      limit: 200,
      pagination: false,
      sort: '-eventDate',
    })
    return res.docs
  } catch (error) {
    console.error('[Events] Error fetching from Payload:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const events = await getEvents()

  return (
    <SidebarShell>
      <MainbarShell>
        <EventsPageContent events={events} />
      </MainbarShell>
    </SidebarShell>
  )
}
