import {
  FeaturedMembersSection,
  type FeaturedRow,
} from '@/components/features/home/featuredMembersSection'
import { GalleryMarqueeSection } from '@/components/features/home/galleryMarqueeSection'
import { HeroSection } from '@/components/features/home/heroSection'
import { LatestEventsSection } from '@/components/features/home/latestEventsSection'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Event, Gallery, Member } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

/** Keep only populated relationship docs (drop bare ids). */
function objectsOnly(value: (number | Member)[] | null | undefined): Member[] {
  if (!Array.isArray(value)) return []
  return value.filter((m): m is Member => typeof m === 'object' && m !== null)
}

/** Each gallery doc is one uploaded photo — take its display URL. */
function galleryImageUrls(galleries: Gallery[]): string[] {
  const urls: string[] = []
  for (const photo of galleries) {
    const src = photo.sizes?.tablet?.url || photo.url
    if (src) urls.push(src)
  }
  return urls
}

/** Deterministic-enough shuffle; runs at build / ISR regeneration. */
function pickRandom(urls: string[], count: number): string[] {
  const arr = [...urls]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count)
}

async function getHomeData() {
  try {
    const payload = await getPayload({ config })
    const [eventsRes, featured, galleryRes] = await Promise.all([
      payload.find({
        collection: 'events',
        depth: 1,
        limit: 5,
        pagination: false,
        sort: '-eventDate',
      }),
      payload.findGlobal({ slug: 'home-featured-members', depth: 2 }),
      payload.find({ collection: 'gallery', depth: 1, limit: 1000, pagination: false }),
    ])

    // Each row: a category (its name becomes the label) + curated members.
    const rows: FeaturedRow[] = (featured.rows ?? []).map((row) => {
      const category =
        typeof row.category === 'object' && row.category !== null ? (row.category.name ?? '') : ''
      return { id: String(row.id), category, members: objectsOnly(row.members) }
    })

    return {
      events: eventsRes.docs as Event[],
      rows,
      galleryImages: pickRandom(galleryImageUrls(galleryRes.docs as Gallery[]), 15),
    }
  } catch (error) {
    console.error('[Home] Error fetching data:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const { events, rows, galleryImages } = await getHomeData()

  return (
    <SidebarShell>
      <MainbarShell hideScrollbar>
        <HeroSection />
        <LatestEventsSection events={events} />
        <FeaturedMembersSection rows={rows} />
        <GalleryMarqueeSection images={galleryImages} />
      </MainbarShell>
    </SidebarShell>
  )
}
