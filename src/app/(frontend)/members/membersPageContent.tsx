'use client'

import ChromaScene from '@/components/common/chromaScene'
import { EmptyState } from '@/components/common/emptyState'
import type { Member as MemberDoc, MemberPhoto as MemberPhotoDoc } from '@/payload/payload-types'
import React from 'react'

// Local ChromaGrid component (client-side wrapper)
import ChromaGridWrapper from '@/components/common/chromaGridWrapper'

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
  const map = new Map<string, { items: MemberDoc[]; sortOrder: number; batchOrder: string }>()
  for (const m of members) {
    const catObj =
      typeof m.category === 'object' && m.category
        ? (m.category as unknown as Record<string, unknown>)
        : undefined
    const catLabel = (catObj?.name as string) ?? (catObj?.slug as string) ?? 'Uncategorized'
    const sortOrder = (catObj?.sortOrder as number) ?? 999 // Use 999 for uncategorized so they appear last
    // Set per category in the admin. Uncategorized members have no category doc
    // to read it from, so they keep the historical oldest-first order.
    const batchOrder = (catObj?.batchOrder as string) ?? 'oldestFirst'

    const entry = map.get(catLabel)
    if (!entry) {
      const newEntry = { items: [m], sortOrder, batchOrder }
      map.set(catLabel, newEntry)
    } else {
      entry.items.push(m)
    }
  }

  // Within a category, members are grouped into batches (startYear–endYear).
  // Batch direction is the category's own setting; inside a batch, role
  // sortOrder decides.
  const sorted = Array.from(map.entries())
    .map(([category, { items, sortOrder, batchOrder }]) => {
      const batchMap = new Map<string, { startYear: number; items: MemberDoc[] }>()
      for (const m of items) {
        const start = m.startYear ?? 0
        const label = m.startYear ? `${m.startYear} – ${m.endYear ?? 'Present'}` : 'Batch Unknown'
        const entry = batchMap.get(label)
        if (entry) entry.items.push(m)
        else batchMap.set(label, { startYear: start, items: [m] })
      }

      const newestFirst = batchOrder === 'newestFirst'
      const batches = Array.from(batchMap.entries())
        .map(([label, { startYear, items: batchItems }]) => {
          batchItems.sort((a, b) => getPrimaryRoleSortOrder(a) - getPrimaryRoleSortOrder(b))
          return { label, startYear, items: batchItems }
        })
        .sort((a, b) => (newestFirst ? b.startYear - a.startYear : a.startYear - b.startYear))

      return { category, batches, sortOrder }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder) // Sort categories by their sortOrder

  return sorted
}

function resolveImageSrc(photo: MemberPhotoDoc | null) {
  if (!photo) return undefined
  const sizes = photo.sizes as unknown as Record<string, { url?: string }> | undefined
  // Relative (/api/media/…) and absolute (S3) URLs both resolve in the browser.
  return sizes?.card?.url || sizes?.thumbnail?.url || photo.url || undefined
}

function toChromaItems(items: MemberDoc[]) {
  return items.map((m) => {
    const photo = (m.photo as unknown as MemberPhotoDoc | null) ?? null
    const src = resolveImageSrc(photo) ?? 'https://via.placeholder.com/600x600?text=Member'
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

/**
 * Client presentation for the members page. Data is fetched server-side and
 * passed in; this component owns the ChromaScene cursor effect and grouping.
 */
export function MembersPageContent({ members }: { members: MemberDoc[] }) {
  const grouped = React.useMemo(() => groupByCategorySorted(members), [members])

  return (
    <ChromaScene radius={300} damping={0.45} fadeOut={0.6} ease="power3.out">
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
                <ChromaGridWrapper className="w-full" items={toChromaItems(batch.items)} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </ChromaScene>
  )
}
