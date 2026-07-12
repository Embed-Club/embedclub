import { MainbarShell, SidebarShell } from '@/components/layout/frontend-shell'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell />
    </SidebarShell>
  )
}
