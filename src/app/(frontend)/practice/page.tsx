import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import DashboardTitle from "./dashtitle";
import { ThemedStarsBackground } from "@/components/ThemedStarsBackground";

export default async function Page() {

  return (
    
      <SidebarShell>
      <MainbarShell>
        <ThemedStarsBackground>
          <DashboardTitle />

        </ThemedStarsBackground>        
      </MainbarShell>
    </SidebarShell>
   
  );
}
