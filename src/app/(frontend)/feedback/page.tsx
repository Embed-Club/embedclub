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
        ],
      },
      sort: '-createdAt',
      limit: 50,
      depth: 1,
    })
    return forms.docs
  } catch (error) {
    console.error('[Feedback] Error fetching forms:', error)
    return []
  }
}

export default async function Page() {
  const forms = await getFeedbackForms()
  const now = Date.now()
  const cards = forms.map((form) => formToCard(form, now))

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          FEEDBACK
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <FormsListing cards={cards} emptyTitle="No Feedback Forms Yet" />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
