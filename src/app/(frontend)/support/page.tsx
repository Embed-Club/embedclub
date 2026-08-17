import { EmptyState } from '@/components/common/emptyState'
import { PageTitle } from '@/components/common/pageTitle'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Support Embed Club.',
}

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>Support</PageTitle>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          <EmptyState
            title="Nothing Here Yet"
            message="Support information hasn't been added yet — check back soon!"
          />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
