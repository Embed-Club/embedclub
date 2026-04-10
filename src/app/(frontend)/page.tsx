import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import { ThemedStarsBackground } from '@/components/theme/ThemedStarsBackground'
import DashboardTitle from './title'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <div className="h-full w-full overflow-hidden rounded-lg">
          <ThemedStarsBackground>
            <DashboardTitle />
          </ThemedStarsBackground>
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
