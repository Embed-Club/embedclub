import { PageTitle } from '@/components/common/pageTitle'
import { EmbedDaysPage } from '@/components/features/embedthon/embedDaysPage'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embed Days | Embed Club',
  description: "Embers '26, the national level technical fest from Embed Club.",
}

export default function EmbedDaysRoute() {
  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>EMBED DAYS</PageTitle>
        <EmbedDaysPage />
      </MainbarShell>
    </SidebarShell>
  )
}
