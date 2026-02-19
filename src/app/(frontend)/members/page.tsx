"use client"

import React from "react"
import { SidebarShell, MainbarShell } from "@/components/FrontendShell"
import ChromaScene from "@/components/ChromaScene"
import { Skeleton } from "@/components/ui/skeleton"

// Local ChromaGrid component (client-side wrapper)
import ChromaGridWrapper from "@/components/ChromaGridWrapper"

import type { Member as MemberDoc, MemberPhoto as MemberPhotoDoc } from "@/payload-types"

function getBaseUrl() {
  return typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || "http://localhost:3000"
}

async function getMembers(base: string): Promise<MemberDoc[]> {
  const res = await fetch(`${base}/api/members?depth=2&limit=200&sort=-startYear`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to load members: ${res.status}`)
  }
  const data = (await res.json()) as { docs: MemberDoc[] }
  return data.docs
}

function getPrimaryRoleSortOrder(member: MemberDoc) {
  // roles is configured as hasMany: false (single relationship)
  const rolesValue = member.roles as any

  if (rolesValue && typeof rolesValue === "object" && !Array.isArray(rolesValue)) {
    const sortOrder = (rolesValue as any).sortOrder
    return typeof sortOrder === "number" ? sortOrder : 999
  }

  // Fallback: if roles somehow comes as an array, pick the lowest sortOrder
  if (Array.isArray(rolesValue)) {
    const sortOrders = rolesValue
      .map((r) => (typeof r === "object" && r ? (r as any).sortOrder : undefined))
      .filter((v): v is number => typeof v === "number")

    if (sortOrders.length === 0) return 999
    return Math.min(...sortOrders)
  }

  return 999
}

function groupByCategorySorted(members: MemberDoc[]) {
  const map = new Map<string, { items: MemberDoc[]; sortOrder: number }>()
  for (const m of members) {
    const catObj = typeof m.category === "object" && m.category ? (m.category as any) : undefined
    const catLabel: string = catObj?.name ?? catObj?.slug ?? "Uncategorized"
    const sortOrder = catObj?.sortOrder ?? 999 // Use 999 for uncategorized so they appear last
    
    let entry = map.get(catLabel)
    if (!entry) {
      entry = { items: [], sortOrder }
      map.set(catLabel, entry)
    }
    entry.items.push(m)
  }
  
  // Convert to array and sort by sortOrder
  const sorted = Array.from(map.entries())
    .map(([category, { items, sortOrder }]) => {
      // Separate current members (no endYear) from past members (with endYear)
      const currentMembers = items.filter(m => !m.endYear)
      const pastMembers = items.filter(m => m.endYear)
      
      // Sort current members: first by startYear (descending), then by role order
      currentMembers.sort((a, b) => {
        // Primary sort: year descending (most recent first)
        const yearDiff = (b.startYear ?? 0) - (a.startYear ?? 0)
        if (yearDiff !== 0) return yearDiff
        
        // Secondary sort: role order (within same year) - lower sortOrder first
        const sortOrderA = getPrimaryRoleSortOrder(a)
        const sortOrderB = getPrimaryRoleSortOrder(b)
        return sortOrderA - sortOrderB
      })
      
      // Sort past members: first by startYear (descending), then by role order
      pastMembers.sort((a, b) => {
        // Primary sort: year descending (most recent first)
        const yearDiff = (b.startYear ?? 0) - (a.startYear ?? 0)
        if (yearDiff !== 0) return yearDiff
        
        // Secondary sort: role order (within same year) - lower sortOrder first
        const sortOrderA = getPrimaryRoleSortOrder(a)
        const sortOrderB = getPrimaryRoleSortOrder(b)
        return sortOrderA - sortOrderB
      })
      
      // Combine: current members first, then past members
      const sortedItems = [...currentMembers, ...pastMembers]
      
      return { category, items: sortedItems, sortOrder }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder) // Sort categories by their sortOrder
  
  return sorted
}

function resolveImageSrc(photo: MemberPhotoDoc | null, base: string) {
  if (!photo) return undefined
  const raw =
    (photo.sizes as any)?.card?.url ||
    (photo.sizes as any)?.thumbnail?.url ||
    photo.url
  if (!raw) return undefined
  return raw.startsWith("http") ? raw : `${base}${raw}`
}

function toChromaItems(items: MemberDoc[], base: string) {
  return items.map((m) => {
    const photo = (m.photo as unknown as MemberPhotoDoc | null) ?? null
    const src = resolveImageSrc(photo, base) ?? "https://via.placeholder.com/600x600?text=Member"
    let rolesLabel = ""
    if (Array.isArray(m.roles)) {
      rolesLabel = (m.roles as any[])
        .map((r) => r?.name ?? r?.slug ?? r?.id)
        .filter(Boolean)
        .join(", ")
    } else if (m.roles && typeof m.roles === "object") {
      rolesLabel = (m.roles as any)?.name ?? (m.roles as any)?.slug ?? ""
    }
    const yearsLabel = m.startYear ? `${m.startYear}${m.endYear ? `–${m.endYear}` : ""}` : ""
    const subtitle = rolesLabel || yearsLabel || "Member"
    const handle = yearsLabel || undefined
    const url = m.linkedin || m.github || undefined

    return {
      image: src,
      title: m.fullName ?? "Member",
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
  const [baseUrl, setBaseUrl] = React.useState("")

  React.useEffect(() => {
    const base = getBaseUrl()
    setBaseUrl(base)

    getMembers(base)
      .then((data) => {
        setMembers(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching members:", err)
        setError("Failed to load members")
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
            <div className="flex h-full items-center justify-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <div className="px-4 py-8 md:px-8 lg:px-12">
              <h1 className="mb-30 left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl text-foreground">EBERS</h1>

              {grouped.map(({ category, items }) => {
                const currentMembers = items.filter((m) => !m.endYear)
                const pastMembers = items.filter((m) => m.endYear)

                return (
                  <section key={category} className="mb-12">
                    <h2 className="mb-4 text-2xl font-semibold text-foreground">{category}</h2>

                    {currentMembers.length > 0 && (
                      <ChromaGridWrapper
                        className="w-full"
                        items={toChromaItems(currentMembers, base)}
                      />
                    )}

                    {currentMembers.length > 0 && pastMembers.length > 0 && (
                      <div className="my-8" />
                    )}

                    {pastMembers.length > 0 && (
                      <ChromaGridWrapper
                        className="w-full"
                        items={toChromaItems(pastMembers, base)}
                      />
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </ChromaScene>
      </MainbarShell>
    </SidebarShell>
  )
}
