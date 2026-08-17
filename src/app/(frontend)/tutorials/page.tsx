import { getResourceCards } from '@/app/(frontend)/resources/getResourceCards'
import { ResourcesPageContent } from '@/app/(frontend)/resources/resourcesPageContent'
import { PageTitle } from '@/components/common/pageTitle'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Tutorials',
  description: 'Step-by-step embedded systems tutorials from Embed Club.',
}

export default async function Page() {
  const tutorials = await getResourceCards('tutorials')

  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>TUTORIALS</PageTitle>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ResourcesPageContent
            resources={tutorials}
            emptyTitle="No Tutorials Yet"
            basePath="/tutorials"
          />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
