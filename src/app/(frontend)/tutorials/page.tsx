import { getResourceCards } from '@/app/(frontend)/resources/getResourceCards'
import { ResourcesPageContent } from '@/app/(frontend)/resources/resourcesPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Tutorials | Embed Club',
  description: 'Step-by-step embedded systems tutorials from Embed Club.',
}

export default async function Page() {
  const tutorials = await getResourceCards('tutorial')

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          TUTORIALS
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ResourcesPageContent resources={tutorials} emptyTitle="No Tutorials Yet" />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
