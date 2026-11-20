import { JsonLdScript } from '@/components/common/jsonLdScript'
import { EventDetailView } from '@/components/features/events/eventDetailView'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { breadcrumbJsonLd, singleEventJsonLd } from '@/lib/structuredData'
import type { Event } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

interface EventPageProps {
  params: Promise<{
    slug: string
  }>
}

function getEventImageUrl(event: Event): string | undefined {
  return typeof event.image === 'object' && event.image !== null && 'url' in event.image
    ? (event.image.url ?? undefined)
    : undefined
}

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      depth: 2,
      limit: 1,
    })
    return result.docs[0] || null
  } catch (error) {
    console.error('[Event Detail] Error fetching event:', error)
    return null
  }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) return { title: 'Event Not Found' }

  const imageUrl = getEventImageUrl(event)

  return {
    title: event.title,
    description: event.shortDescription ?? undefined,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: `${event.title} | Embed Club`,
      description: event.shortDescription ?? undefined,
      type: 'website',
      url: `/events/${slug}`,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: event.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.shortDescription ?? undefined,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <JsonLdScript
          data={[
            singleEventJsonLd(event),
            breadcrumbJsonLd([
              { name: 'Events', path: '/events' },
              { name: event.title, path: `/events/${slug}` },
            ]),
          ]}
        />
        <EventDetailView event={event} />
      </MainbarShell>
    </SidebarShell>
  )
}
