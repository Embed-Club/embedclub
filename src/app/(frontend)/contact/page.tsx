import { EmptyState } from '@/components/common/emptyState'
import { PageTitle } from '@/components/common/pageTitle'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Embed Club.',
}

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>Contact</PageTitle>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          <EmptyState
            title="Nothing Here Yet"
            message="Contact details haven't been added yet — check back soon!"
          />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
