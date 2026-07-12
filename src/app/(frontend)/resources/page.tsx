import { getResourceCards } from '@/app/(frontend)/resources/get-resource-cards'
import { ResourcesPageContent } from '@/app/(frontend)/resources/resources-page-content'
import { MainbarShell, SidebarShell } from '@/components/layout/frontend-shell'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

export default async function Page() {
  const resources = await getResourceCards('resource')

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          RESOURCES
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ResourcesPageContent resources={resources} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
