'use client'

import { ContentPanel } from '@/components/ContentPanel'
import { AppSidebar } from '@/components/DesktopMenu'
import MobileMenu from '@/components/MobileMenu'
import { ModeToggle } from '@/components/ThemeToggle'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import React, { useState } from 'react'

export function SidebarShell({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <MobileMenu />
      <div className="absolute right-8 top-6 z-40 hidden lg:block">
        <ModeToggle />
      </div>
      {children}
    </SidebarProvider>
  )
}

interface MainbarShellProps {
  children?: React.ReactNode
  borderless?: boolean
}

export const ScrollContainerContext = React.createContext<HTMLDivElement | null>(null)

export function MainbarShell({ children, borderless }: MainbarShellProps) {
  const isMobile = useIsMobile()
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)

  return (
    <ScrollContainerContext.Provider value={scrollEl}>
      <ContentPanel ref={setScrollEl} borderless={borderless || isMobile}>
        <div className="h-full w-full relative">{children}</div>
      </ContentPanel>
    </ScrollContainerContext.Provider>
  )
}

export default function FrontendShell({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarShell>
      <MainbarShell>{children}</MainbarShell>
    </SidebarShell>
  )
}
