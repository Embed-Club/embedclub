import { EmbedDaysPage } from '@/components/features/embedthon/embedDaysPage'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embed Days | Embed Club',
  description: 'Choose between Embedthon and Embers 26 from Embed Club.',
}

export default function EmbedDaysRoute() {
  return (
    <SidebarShell>
      <MainbarShell>
        <EmbedDaysPage />
      </MainbarShell>
    </SidebarShell>
  )
}
