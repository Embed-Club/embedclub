'use client'

import ChromaScene from '@/components/common/chromaScene'
import { EmptyState } from '@/components/common/emptyState'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

// Local ChromaGrid component (client-side wrapper)
import ChromaGridWrapper from '@/components/common/chromaGridWrapper'

import type { Member as MemberDoc, MemberPhoto as MemberPhotoDoc } from '@/payload/payload-types'

function getBaseUrl() {
  return typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || 'http://localhost:3000'
}

async function getMembers(base: string): Promise<MemberDoc[]> {
  try {
    const res = await fetch(`${base}/api/members?depth=2&limit=200&sort=-startYear`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Failed to fetch members:', res.status, res.statusText)
      return []
    }
    const data = (await res.json()) as { docs: MemberDoc[] }
    return data.docs || []
  } catch (error) {
    console.error('[Members] Error fetching from Payload:', error)
    return []
  }
}

function getPrimaryRoleSortOrder(member: MemberDoc) {
  // roles is configured as hasMany: false (single relationship)
  const rolesValue = member.roles as unknown as Record<string, unknown>

  if (rolesValue && typeof rolesValue === 'object' && !Array.isArray(rolesValue)) {
    const sortOrder = (rolesValue as unknown as Record<string, unknown>).sortOrder
    return typeof sortOrder === 'number' ? sortOrder : 999
  }

  // Fallback: if roles somehow comes as an array, pick the lowest sortOrder
  if (Array.isArray(rolesValue)) {
    const sortOrders = rolesValue
      .map((r) =>
        typeof r === 'object' && r
          ? (r as unknown as Record<string, unknown>).sortOrder
          : undefined,
      )
      .filter((v): v is number => typeof v === 'number')

    if (sortOrders.length === 0) return 999
    return Math.min(...sortOrders)
  }

  return 999
}

function groupByCategorySorted(members: MemberDoc[]) {
  const map = new Map<string, { items: MemberDoc[]; sortOrder: number }>()
  for (const m of members) {
    const catObj =
      typeof m.category === 'object' && m.category
        ? (m.category as unknown as Record<string, unknown>)
        : undefined
    const catLabel = (catObj?.name as string) ?? (catObj?.slug as string) ?? 'Uncategorized'
    const sortOrder = (catObj?.sortOrder as number) ?? 999 // Use 999 for uncategorized so they appear last

    const entry = map.get(catLabel)
    if (!entry) {
      const newEntry = { items: [m], sortOrder }
      map.set(catLabel, newEntry)
    } else {
      entry.items.push(m)
    }
  }

  // Within a category, members are grouped into batches (startYear–endYear).
  // Batches run oldest-first; inside a batch, role sortOrder decides.
  const sorted = Array.from(map.entries())
    .map(([category, { items, sortOrder }]) => {
      const batchMap = new Map<string, { startYear: number; items: MemberDoc[] }>()
      for (const m of items) {
        const start = m.startYear ?? 0
        const label = m.startYear ? `${m.startYear} – ${m.endYear ?? 'Present'}` : 'Batch Unknown'
        const entry = batchMap.get(label)
        if (entry) entry.items.push(m)
        else batchMap.set(label, { startYear: start, items: [m] })
      }

      const batches = Array.from(batchMap.entries())
        .map(([label, { startYear, items: batchItems }]) => {
          batchItems.sort((a, b) => getPrimaryRoleSortOrder(a) - getPrimaryRoleSortOrder(b))
          return { label, startYear, items: batchItems }
        })
        .sort((a, b) => a.startYear - b.startYear) // oldest batch first

      return { category, batches, sortOrder }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder) // Sort categories by their sortOrder

  return sorted
}

function resolveImageSrc(photo: MemberPhotoDoc | null, base: string) {
  if (!photo) return undefined
  const sizes = photo.sizes as unknown as Record<string, { url?: string }> | undefined
  const raw = sizes?.card?.url || sizes?.thumbnail?.url || photo.url
  if (!raw) return undefined
  return raw.startsWith('http') ? raw : `${base}${raw}`
}

function toChromaItems(items: MemberDoc[], base: string) {
  return items.map((m) => {
    const photo = (m.photo as unknown as MemberPhotoDoc | null) ?? null
    const src = resolveImageSrc(photo, base) ?? 'https://via.placeholder.com/600x600?text=Member'
    let rolesLabel = ''
    if (Array.isArray(m.roles)) {
      rolesLabel = (m.roles as unknown as Array<Record<string, unknown>>)
        .map((r) => r?.name ?? r?.slug ?? r?.id)
        .filter(Boolean)
        .join(', ')
    } else if (m.roles && typeof m.roles === 'object') {
      rolesLabel =
        ((m.roles as unknown as Record<string, unknown>)?.name as string) ??
        ((m.roles as unknown as Record<string, unknown>)?.slug as string) ??
        ''
    }
    const yearsLabel = m.startYear ? `${m.startYear}${m.endYear ? `–${m.endYear}` : ''}` : ''
    const subtitle = rolesLabel || yearsLabel || 'Member'
    const handle = yearsLabel || undefined
    const url = m.linkedin || m.github || undefined

    return {
      image: src,
      title: m.fullName ?? 'Member',
      subtitle,
      handle,
      url,
    }
  })
}

function MemberCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function MembersGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder list
        <MemberCardSkeleton key={index} />
      ))}
    </div>
  )
}

function MembersSkeleton() {
  return (
    <div className="px-4 py-8 md:px-8 lg:px-12">
      <Skeleton className="mb-6 h-9 w-40" />

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholder list
        <section key={sectionIndex} className="mb-12 space-y-6">
          <Skeleton className="h-7 w-48" />
          <MembersGridSkeleton count={8} />
        </section>
      ))}
    </div>
  )
}

export default function Page() {
  const [members, setMembers] = React.useState<MemberDoc[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [baseUrl, setBaseUrl] = React.useState('')

  React.useEffect(() => {
    const base = getBaseUrl()
    setBaseUrl(base)

    getMembers(base)
      .then((data) => {
        setMembers(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching members:', err)
        setError('Failed to load members')
        setIsLoading(false)
      })
  }, [])

  const grouped = React.useMemo(() => groupByCategorySorted(members), [members])
  const base = baseUrl || getBaseUrl()

  return (
    <SidebarShell>
      <MainbarShell>
        <ChromaScene radius={300} damping={0.45} fadeOut={0.6} ease="power3.out">
          {isLoading ? (
            <MembersSkeleton />
          ) : error ? (
            <div className="flex h-full w-full items-center justify-center px-4">
              <EmptyState title="No Members Yet" />
            </div>
          ) : (
            <div className="px-4 py-8 md:px-8 lg:px-12">
              <h1 className="mb-30 left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl text-foreground">
                MEMBERS
              </h1>

              {grouped.length === 0 && <EmptyState title="No Members Yet" />}

              {grouped.map(({ category, batches }) => (
                <section key={category} className="mb-12">
                  <h2 className="mb-4 text-2xl font-semibold text-foreground">{category}</h2>

                  {batches.map((batch) => (
                    <div key={batch.label} className="mb-8">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-sm font-semibold tracking-widest text-primary uppercase">
                          {batch.label}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <ChromaGridWrapper
                        className="w-full"
                        items={toChromaItems(batch.items, base)}
                      />
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </ChromaScene>
      </MainbarShell>
    </SidebarShell>
  )
}
