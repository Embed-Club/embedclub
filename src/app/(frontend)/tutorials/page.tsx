import ComingSoon from '@/components/common/ComingSoon'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <ComingSoon title="TUTORILS" />
      </MainbarShell>
    </SidebarShell>
  )
}
