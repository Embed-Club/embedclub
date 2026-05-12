import Masonry from '@/components/features/gallery/Masonry'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import type { Gallery } from '@/payload/payload-types'

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

export default async function Page() {
  const gallery = await getGallery(getBaseUrl())
  
  if (gallery.length === 0) {
    return (
      <SidebarShell>
        <MainbarShell>
          <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
            GALLERY
          </h1>
          <div className="h-full w-full px-2 pt-16 md:pt-32 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Gallery Unavailable</p>
              <p className="text-neutral-600 dark:text-neutral-400">We're experiencing a temporary issue loading gallery items. Please refresh the page or try again in a few moments.</p>
            </div>
          </div>
        </MainbarShell>
      </SidebarShell>
    )
  }
  
  const items = gallery.map((g) => ({
    id: g.id.toString(),
    img: g.url ?? '',
    url: g.url ?? '',
    height: g.height ?? 400,
    width: g.width ?? 400,
  }))

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          GALLERY
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32 ">
          <Masonry
            items={items}
            ease="power3.out"
            duration={0.5}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            colorShiftOnHover={false}
          />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
