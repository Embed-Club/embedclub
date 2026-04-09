import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell />
    </SidebarShell>
  )
}
