import { EmptyState } from '@/components/common/emptyState'
import { PageTitle } from '@/components/common/pageTitle'
import Masonry from '@/components/features/gallery/masonry'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Gallery } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
// Using Payload's local API (getPayload) means no self-HTTP hop and no
// "Dynamic server usage" - the page is statically renderable.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos from Embed Club workshops, builds, and events.',
}

async function getGallery(): Promise<Gallery[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'gallery',
      depth: 1,
      limit: 1000,
      pagination: false,
      // Drag-arranged order from the admin list view
      sort: '_order',
    })
    return res.docs
  } catch (error) {
    console.error('[Gallery] Error fetching from Payload:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

/** Each gallery doc is one uploaded photo (file + caption). */
function toMasonryItems(photos: Gallery[]) {
  const items: {
    id: string
    img: string
    url: string
    height: number
    width: number
    caption?: string
  }[] = []
  for (const photo of photos) {
    // `tablet` keeps the NATURAL aspect ratio (thumbnail/card are square-ish
    // crops that flatten masonry into a grid). Fall back to the original.
    const src = photo.sizes?.tablet?.url || photo.url
    if (!src) continue
    items.push({
      id: String(photo.id),
      img: src,
      url: photo.url ?? src,
      // Natural dimensions drive the masonry column heights.
      height: photo.height ?? 400,
      width: photo.width ?? 400,
      caption: photo.caption ?? undefined,
    })
  }
  return items
}

export default async function Page() {
  const gallery = await getGallery()
  const items = toMasonryItems(gallery)

  if (items.length === 0) {
    return (
      <SidebarShell>
        <MainbarShell>
          <PageTitle>GALLERY</PageTitle>
          <div className="h-full w-full px-2 pt-16 md:pt-32 flex items-center justify-center">
            <EmptyState title="No Photos Yet" />
          </div>
        </MainbarShell>
      </SidebarShell>
    )
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>GALLERY</PageTitle>
        <div className="h-full w-full px-2 pt-16 md:pt-32 ">
          <Masonry items={items} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
