import { formToCard } from '@/components/features/forms/formCardData'
import { FormsListing } from '@/components/features/forms/formsListing'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Forms',
  description: 'Registrations and sign-up forms for Embed Club events.',
}

async function getForms() {
  try {
    const payload = await getPayload({ config })
    const forms = await payload.find({
      collection: 'forms',
      where: {
        and: [
          // Feedback has its own page; this lists everything else.
          { type: { not_equals: 'feedback' } },
          // Sections are reached through their container, which is listed in
          // their place — showing both would put "Day 1" and "Day 2" on the
          // index as if they were unrelated forms.
          { sectionOf: { exists: false } },
        ],
      },
      sort: '-createdAt',
      limit: 50,
      depth: 1,
    })
    return forms.docs
  } catch (error) {
    console.error('[Forms] Error fetching forms:', error)
    return []
  }
}

export default async function Page() {
  const forms = await getForms()
  const now = Date.now()
  const cards = forms.map((form) => formToCard(form, now))

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          FORMS
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <FormsListing cards={cards} emptyTitle="No Open Forms Right Now" />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
