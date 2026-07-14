import { MemberCutoutCard } from '@/components/features/home/memberCutoutCard'
import type { Member } from '@/payload/payload-types'

export type FeaturedRow = {
  id: string
  category: string
  members: Member[]
}

/** Third section: curated members in category-driven rows (label = category). */
export function FeaturedMembersSection({ rows }: { rows: FeaturedRow[] }) {
  const visibleRows = rows.filter((r) => r.members.length > 0)

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center gap-12 px-6 py-20 md:px-12 lg:px-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-5xl">Meet the Team</h2>
        <p className="mt-2 text-muted-foreground">The people building Embed Club.</p>
      </div>

      {visibleRows.length === 0 ? (
        <p className="text-muted-foreground">Featured members coming soon.</p>
      ) : (
        <div className="flex w-full flex-col gap-12">
          {visibleRows.map((row) => (
            <div key={row.id} className="flex flex-col items-center gap-5">
              {row.category && (
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {row.category}
                </span>
              )}
              <div className="flex flex-wrap items-stretch justify-center gap-6">
                {row.members.map((m) => (
                  <div key={m.id} className="w-40 sm:w-48 md:w-56">
                    <MemberCutoutCard member={m} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
