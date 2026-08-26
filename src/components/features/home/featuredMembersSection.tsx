import { MemberCutoutCard } from '@/components/features/home/memberCutoutCard'
import type { Member } from '@/payload/payload-types'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/dist/client/link'

export type FeaturedRow = {
  id: string
  category: string
  members: Member[]
}

/** Third section: curated members in category-driven rows (label = category). */
export function FeaturedMembersSection({ rows }: { rows: FeaturedRow[] }) {
  const visibleRows = rows.filter((r) => r.members.length > 0)

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col justify-center gap-12 px-6 py-20 md:px-12 lg:px-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-normal [-webkit-text-stroke:1.2px]">
            Meet the Team
          </h2>
          <p className="mt-2 text-muted-foreground font-semibold tracking-wide">
            The people building Embed Club.
          </p>
        </div>
        <Link
          href="/members"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          See all members
          <ArrowUpRight className="h-4 w-4" />
        </Link>
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
              <div className="flex w-full flex-wrap items-stretch justify-center gap-4 sm:gap-6">
                {row.members.map((m) => (
                  <div
                    key={m.id}
                    className="w-[calc((100%-1rem)/2)] shrink-0 sm:w-52 lg:w-64 xl:w-72"
                  >
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
