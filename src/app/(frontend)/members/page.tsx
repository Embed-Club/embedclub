import { MembersPageContent } from '@/app/(frontend)/members/membersPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Member } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Members',
  description: 'The people behind Embed Club — organizers, mentors, and members.',
}

/** All members, fetched once via the Payload local API (depth 2 expands
 *  category / roles / photo relationships). */
async function getMembers(): Promise<Member[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'members',
      depth: 2,
      limit: 200,
      pagination: false,
      sort: '-startYear',
    })

    // `gender` is admin-only — it exists to pick a generated avatar, nothing
    // more. The page is a client component, so anything left on the doc ships
    // in the RSC payload and is readable in page source: "not rendered" is not
    // the same as "not published". Dropped here, at the boundary.
    return res.docs.map(({ gender: _gender, ...member }) => member as Member)
  } catch (error) {
    console.error('[Members] Error fetching from Payload:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const members = await getMembers()

  return (
    <SidebarShell>
      <MainbarShell>
        <MembersPageContent members={members} />
      </MainbarShell>
    </SidebarShell>
  )
}
