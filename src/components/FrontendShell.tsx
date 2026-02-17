"use client";

import React from "react";
import { AppSidebar } from "@/components/DesktopMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ThemeToggle";
import { ContentPanel } from "@/components/ContentPanel";
import MobileMenu from "@/components/MobileMenu";
import { useIsMobile } from "@/hooks/use-mobile";

export function SidebarShell({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile menu */}
      <MobileMenu />

      {/* Top-right Dark Mode Toggle */}
      <div className="absolute right-8 top-6 z-40 hidden lg:block">
        <ModeToggle />
      </div>

      {/* Render inner content */}
      {children}
    </SidebarProvider>
  );
}

interface MainbarShellProps {
  children?: React.ReactNode
  borderless?: boolean
}

export function MainbarShell({ children, borderless }: MainbarShellProps) {
  const isMobile = useIsMobile()
  
  return (
    <ContentPanel borderless={borderless || isMobile}>
      <div className="h-full w-full relative">
        {children}
      </div>
    </ContentPanel>
  );
}

/**
 * If you ever want a single wrapper combining both (useful for smaller pages),
 * you can export this too. Optional.
 */
export default function FrontendShell({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarShell>
      <MainbarShell>{children}</MainbarShell>
    </SidebarShell>
  );
}
