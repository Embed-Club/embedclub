import { EmptyState } from '@/components/common/emptyState'
import Masonry from '@/components/features/gallery/masonry'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Gallery, Media } from '@/payload/payload-types'

function getBaseUrl() {
  return typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || 'http://localhost:3000'
}

async function getGallery(base: string): Promise<Gallery[]> {
  try {
    const res = await fetch(`${base}/api/gallery?depth=1&limit=1000`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Failed to fetch gallery:', res.status, res.statusText)
      return []
    }

    const data = await res.json()
    return data.docs || []
  } catch (error) {
    console.error('[Gallery] Error fetching from Payload:', error)
    return []
  }
}

/** Flatten every gallery doc's photos (image + caption) into masonry items. */
function toMasonryItems(galleries: Gallery[]) {
  const items: {
    id: string
    img: string
    url: string
    height: number
    width: number
    caption?: string
  }[] = []
  for (const gallery of galleries) {
    for (const photo of gallery.photos ?? []) {
      const image = photo.image
      if (typeof image !== 'object' || image === null) continue
      const media = image as Media
      // `tablet` keeps the NATURAL aspect ratio (thumbnail/card are square-ish
      // crops that flatten masonry into a grid). Fall back to the original.
      const src = media.sizes?.tablet?.url || media.url
      if (!src) continue
      items.push({
        id: `${gallery.id}-${photo.id ?? media.id}`,
        img: src,
        url: media.url ?? src,
        // Natural dimensions drive the masonry column heights.
        height: media.height ?? 400,
        width: media.width ?? 400,
        caption: photo.caption ?? undefined,
      })
    }
  }
  return items
}

export default async function Page() {
  const gallery = await getGallery(getBaseUrl())
  const items = toMasonryItems(gallery)

  if (items.length === 0) {
    return (
      <SidebarShell>
        <MainbarShell>
          <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
            GALLERY
          </h1>
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
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          GALLERY
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32 ">
          <Masonry items={items} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
