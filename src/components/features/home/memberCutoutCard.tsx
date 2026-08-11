'use client'

import {
  CutoutCard,
  CutoutCardContent,
  CutoutCardImage,
  CutoutCardMedia,
  CutoutCardOverlay,
  cutoutCardSurfaceClassName,
} from '@/components/common/cutoutCard'
import { cn } from '@/lib/utils'
import type { Member, MemberPhoto } from '@/payload/payload-types'

/** Best available photo URL for a member (Supabase CDN or placeholder). */
function resolvePhoto(member: Member): string {
  const photo = member.photo
  if (typeof photo === 'object' && photo !== null) {
    const p = photo as MemberPhoto
    const sizes = p.sizes as unknown as Record<string, { url?: string }> | undefined
    // Include thumbnail: small/old source photos only generate the thumbnail
    // size (no 400px card), and the original can 404 — thumbnail beats blank.
    return (
      sizes?.card?.url ||
      sizes?.profile?.url ||
      sizes?.thumbnail?.url ||
      p.url ||
      '/placeholder/placeholder.jpg'
    )
  }
  return '/placeholder/placeholder.jpg'
}

/** First role name, if roles are populated. */
function firstRole(member: Member): string {
  const roles = member.roles
  if (Array.isArray(roles) && roles.length > 0) {
    const r = roles[0]
    if (typeof r === 'object' && r !== null && 'name' in r) return (r as { name: string }).name
  }
  return ''
}

export function MemberCutoutCard({ member }: { member: Member }) {
  const src = resolvePhoto(member)
  const role = firstRole(member)
  const href = member.linkedin || member.github || undefined

  const inner = (
    <>
      <CutoutCardMedia className="aspect-square w-full shrink-0">
        <CutoutCardImage alt={member.fullName} src={src} sizes="(max-width: 768px) 45vw, 16rem" />
        <CutoutCardOverlay />
      </CutoutCardMedia>
      {/* Tighter than the default p-6 so the text block gets more of the card's
          width — full names were being truncated to "Habeeb Ur R...". */}
      <CutoutCardContent className="px-2.5 py-3 text-center">
        <p
          title={member.fullName}
          className="line-clamp-2 font-semibold leading-tight text-foreground transition-colors group-hover/cutout:text-primary"
        >
          {member.fullName}
        </p>
        {role && <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-primary">{role}</p>}
      </CutoutCardContent>
    </>
  )

  return (
    <CutoutCard className="h-full">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(cutoutCardSurfaceClassName, 'flex h-full flex-col')}
        >
          {inner}
        </a>
      ) : (
        <div className={cn(cutoutCardSurfaceClassName, 'flex h-full cursor-default flex-col')}>
          {inner}
        </div>
      )}
    </CutoutCard>
  )
}
