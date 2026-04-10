'use client'

import { ContentPanel } from '@/components/layout/ContentPanel'
import { AppSidebar } from '@/components/layout/DesktopMenu'
import MobileMenu from '@/components/layout/MobileMenu'
import { ModeToggle } from '@/components/theme/ThemeToggle'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export const IntroContext = React.createContext<{
  isIntroFinished: boolean
  setIntroFinished: (finished: boolean) => void
  fillProgress: number
  isExpanded: boolean
}>({
  isIntroFinished: false,
  setIntroFinished: () => {},
  fillProgress: 0,
  isExpanded: false,
})

export function SidebarShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/home' // Adjust as needed
  
  const [isIntroFinished, setIntroFinished] = React.useState(!isLandingPage)
  const [fillProgress, setFillProgress] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    if (!isLandingPage) {
        setIntroFinished(true)
        return
    }

    setIntroFinished(false)
    setIsExpanded(false)
    setFillProgress(0)

    // Sped up synthetic intro
    const duration = 800
    const start = Date.now()
    
    const fillTimer = setInterval(() => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setFillProgress(progress)
        
        if (progress >= 1) {
            clearInterval(fillTimer)
            setTimeout(() => setIsExpanded(true), 200)
            // Wait for expansion + glide (1s) + tiny buffer
            setTimeout(() => setIntroFinished(true), 1300)
        }
    }, 16)
    
    return () => clearInterval(fillTimer)
  }, [isLandingPage])

  return (
    <IntroContext.Provider value={{ isIntroFinished, setIntroFinished, fillProgress, isExpanded }}>
      <SidebarProvider>
        {/* The Evolving Intro Logo - Matches prompt requirements */}
        {/* The Intro Background - Decoupled from logo for smooth reveal */}
        <AnimatePresence>
          {!isIntroFinished && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
              <motion.div 
                initial={{ opacity: 1 }}
                animate={isExpanded ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 bg-background"
              />
            </div>
          )}
        </AnimatePresence>


        <div className={`${isIntroFinished ? 'hidden lg:block' : ''} relative z-[50]`}>
          <AppSidebar />
        </div>
        <MobileMenu />
        <div className="absolute right-8 top-6 z-40 hidden lg:block">
          <ModeToggle />
        </div>
        {children}
      </SidebarProvider>
    </IntroContext.Provider>
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
  const { isIntroFinished } = React.useContext(IntroContext)

  return (
    <ScrollContainerContext.Provider value={scrollEl}>
      <ContentPanel ref={setScrollEl} borderless={borderless || isMobile}>
        <div className="h-full w-full relative">
          <AnimatePresence>
            {!isIntroFinished && !isMobile ? (
              <motion.div
                key="intro-overlay"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-background z-50 flex items-center justify-center"
              >
                {/* Visual placeholder for the main content area during glide */}
                <div className="text-[10px] tracking-[0.4em] uppercase opacity-20 font-bold">
                  Synchronizing System
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isIntroFinished || isMobile ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </div>
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
