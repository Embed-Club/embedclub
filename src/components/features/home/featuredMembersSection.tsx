import { MemberFeatureCard } from '@/components/features/home/memberFeatureCard'
import type { Member } from '@/payload/payload-types'

export type FeaturedMembers = {
  coordinators: Member[]
  core: Member[]
  alumni: Member[]
}

function Row({ label, members }: { label: string; members: Member[] }) {
  if (members.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-primary">{label}</span>
      <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10">
        {members.map((m) => (
          <MemberFeatureCard key={m.id} member={m} />
        ))}
      </div>
    </div>
  )
}

/** Third section: curated members in three rows (coordinators / core / alumni). */
export function FeaturedMembersSection({ coordinators, core, alumni }: FeaturedMembers) {
  const empty = coordinators.length === 0 && core.length === 0 && alumni.length === 0

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center gap-12 px-6 py-20 md:px-12 lg:px-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-5xl">Meet the Team</h2>
        <p className="mt-2 text-muted-foreground">The people building Embed Club.</p>
      </div>

      {empty ? (
        <p className="text-muted-foreground">Featured members coming soon.</p>
      ) : (
        <div className="flex w-full flex-col gap-12">
          <Row label="Coordinators" members={coordinators} />
          <Row label="Core Team" members={core} />
          <Row label="Alumni" members={alumni} />
        </div>
      )}
    </section>
  )
}
