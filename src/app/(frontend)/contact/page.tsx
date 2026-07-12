import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell />
    </SidebarShell>
  )
}
