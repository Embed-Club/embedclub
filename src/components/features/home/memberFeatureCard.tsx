import type { Member, MemberPhoto } from '@/payload/payload-types'

/** Best available photo URL for a member (relative or absolute both resolve). */
function resolvePhoto(member: Member): string {
  const photo = member.photo
  if (typeof photo === 'object' && photo !== null) {
    const p = photo as MemberPhoto
    const sizes = p.sizes as unknown as Record<string, { url?: string }> | undefined
    return sizes?.card?.url || sizes?.thumbnail?.url || p.url || '/placeholder/placeholder.jpg'
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

export function MemberFeatureCard({ member }: { member: Member }) {
  const src = resolvePhoto(member)
  const role = firstRole(member)

  return (
    <figure className="w-36 text-center md:w-48">
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <img
          src={src}
          alt={member.fullName}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <figcaption className="mt-3">
        <p className="font-semibold text-foreground">{member.fullName}</p>
        {role && <p className="text-sm text-primary">{role}</p>}
      </figcaption>
    </figure>
  )
}
