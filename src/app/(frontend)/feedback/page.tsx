import { PageTitle } from '@/components/common/pageTitle'
import { formToCard } from '@/components/features/forms/formCardData'
import { FormsListing } from '@/components/features/forms/formsListing'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Submit feedback for Embed Club workshops and events.',
}

async function getFeedbackForms() {
  try {
    const payload = await getPayload({ config })
    const forms = await payload.find({
      collection: 'forms',
      where: {
        and: [
          { type: { equals: 'feedback' } },
          // Sections are reached through their container, which stands in for
          // them here — the A and B sections of one workshop's feedback are not
          // two things to choose between on this page.
          { sectionOf: { exists: false } },
          // Retired forms stay out of the list. Fifteen of the imported archive
          // are feedback forms, and a visitor looking for the form for last
          // week's workshop should not have to find it among six years of them.
          { active: { equals: true } },
        ],
      },
      sort: '-createdAt',
      limit: 50,
      depth: 1,
    })
    return forms.docs
  } catch (error) {
    console.error('[Feedback] Error fetching forms:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const forms = await getFeedbackForms()
  const now = Date.now()
  const cards = forms.map((form) => formToCard(form, now))

  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>FEEDBACK</PageTitle>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <FormsListing cards={cards} emptyTitle="No Feedback Forms Yet" />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
