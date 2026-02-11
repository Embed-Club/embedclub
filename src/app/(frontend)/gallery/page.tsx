import { SidebarShell, MainbarShell } from "@/components/FrontendShell";
import Masonry from "@/components/Masonry";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Gallery } from "@/payload-types";

function getBaseUrl() {
  return typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_BASE_URL || 'http://localhost:3000'
}

async function getGallery(base: string): Promise<Gallery[]> {
  const res = await fetch(`${base}/api/gallery?depth=1`, {
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
  }));
  return (
    <SidebarShell>
      <MainbarShell>
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
      </MainbarShell>
    </SidebarShell>
  );
}
