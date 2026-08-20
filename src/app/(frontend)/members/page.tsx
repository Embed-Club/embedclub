import { MembersPageContent } from '@/app/(frontend)/members/membersPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { generateMemberAvatar } from '@/lib/memberAvatar'
import type { Member } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild at most every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Members',
  description: 'The people behind Embed Club - organizers, mentors, and members.',
}

/** All members, fetched once via the Payload local API (depth 2 expands
 *  category / roles / photo relationships). */
type MemberWithGeneratedAvatar = Member & { generatedAvatar?: string }

async function getMembers(): Promise<MemberWithGeneratedAvatar[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'members',
      depth: 2,
      limit: 200,
      pagination: false,
      sort: '-startYear',
    })

    // `gender` is admin-only. Use it to generate the fallback before the data
    // crosses into the client component, then drop it from the RSC payload.
    return res.docs.map(({ gender, photo, ...member }) => ({
      ...member,
      ...(typeof photo === 'object' && photo !== null
        ? {}
        : { generatedAvatar: generateMemberAvatar(member.fullName ?? '', gender) }),
      photo,
    })) as MemberWithGeneratedAvatar[]
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
