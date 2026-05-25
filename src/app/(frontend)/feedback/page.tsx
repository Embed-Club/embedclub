import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import type { Metadata } from 'next'
import FeedbackClient from './FeedbackClient'

export const metadata: Metadata = {
  title: 'Feedback | Embed Club',
  description:
    'Submit your feedback for the IoT Application Design Workshop (Section A and Section B) at PACE Embed Club.',
}

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl">
          FEEDBACK
        </h1>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          <FeedbackClient />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
