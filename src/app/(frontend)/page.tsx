import { AudioToggleMini, BackgroundAudio } from '@/components/common/BackgroundAudio'
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
            <BackgroundAudio />
          </ThemedStarsBackground>
        </div>
        {/* Compact audio control, bottom-right; desktop has the toggle next to the theme switch */}
        <div className="absolute bottom-4 right-4 z-40 lg:hidden">
          <AudioToggleMini />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
