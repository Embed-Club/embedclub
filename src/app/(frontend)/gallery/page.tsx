import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import Masonry from "@/components/Masonry";
import type { Gallery } from "@/payload-types";

function getBaseUrl() {
  return typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || 'http://localhost:3000'
}

async function getGallery(base: string): Promise<Gallery[]> {
  const res = await fetch(`${base}/api/gallery?depth=1&limit=1000`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("Failed to fetch");

  const data = await res.json();
  return data.docs;
}


export default async function Page() {
  const gallery = await getGallery(getBaseUrl());
  const items = gallery.map((g) => ({
    id: g.id,
    img: g.url ?? "",
    url: g.url ?? "",
    height: g.height ?? 400,
    width: g.width ?? 400,
  }));

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-20 md:left-20 md:top-12 text-xl font-medium md:text-4xl">
          GALLERY
        </h1>
        <div className="h-full w-full px-2 pt-24 md:pt-32 md:pl-20">
          <Masonry
            items={items}
            ease="power3.out"
            duration={0.5}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            colorShiftOnHover={false}
          ></Masonry>
        </div>
      </MainbarShell>
    </SidebarShell>
  );
}
