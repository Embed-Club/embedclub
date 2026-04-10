import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import ComingSoon from '@/components/common/ComingSoon'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <ComingSoon title="TUTORILS" />
      </MainbarShell>
    </SidebarShell>
  )
}
