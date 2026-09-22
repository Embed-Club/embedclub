import { PageTitle } from '@/components/common/pageTitle'
import { MakeCodeEditor } from '@/components/features/microbit/makeCodeEditor'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { Metadata } from 'next'

// Unlisted: not in the nav or the sitemap, and told to stay out of search.
// Reachable only by typing the address.
export const metadata: Metadata = {
  title: 'Build',
  description: 'Code a micro:bit in the browser and flash it over USB.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>BUILD</PageTitle>
        <div className="h-full w-full px-2 pt-16 pb-12 md:pt-32">
          <MakeCodeEditor />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
