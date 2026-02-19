import FrontendShellWrapper from "@/components/FrontendShellWrapper";
import DashboardTitle from "./title";
import { ThemedStarsBackground } from "@/components/ThemedStarsBackground";

export default async function Page() {

  return (
    <FrontendShellWrapper>
      <div className="h-full w-full overflow-hidden rounded-lg">
        <ThemedStarsBackground>
          <DashboardTitle />
        </ThemedStarsBackground>
      </div>
    </FrontendShellWrapper>
  );
}
