import { getBuildTargetCards } from '@/app/(frontend)/build/getBuildTargetCards'
import { ResourcesPageContent } from '@/app/(frontend)/resources/resourcesPageContent'
import { PageTitle } from '@/components/common/pageTitle'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

// Unlisted: not in the nav or the sitemap, and told to stay out of search.
// Reachable only by typing the address.
export const metadata: Metadata = {
  title: 'Build',
  description: 'Program club boards from the browser and flash them over USB.',
  robots: { index: false, follow: false },
}

export default async function Page() {
  const targets = await getBuildTargetCards()

  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>BUILD</PageTitle>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ResourcesPageContent resources={targets} emptyTitle="No Boards Yet" basePath="/build" />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
