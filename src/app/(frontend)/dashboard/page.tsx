import { SidebarShell, MainbarShell } from '@/components/FrontendShell'
import DashboardTitle from './title'
import { ThemedStarsBackground } from '@/components/ThemedStarsBackground'

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
