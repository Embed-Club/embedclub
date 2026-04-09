import { MainbarShell, SidebarShell } from '@/components/FrontendShell'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell />
    </SidebarShell>
  )
}
