import { MainbarShell, SidebarShell } from '@/components/FrontendShell'
import { ThemedStarsBackground } from '@/components/ThemedStarsBackground'
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
