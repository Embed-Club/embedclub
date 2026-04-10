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
}>({
  isIntroFinished: false,
  setIntroFinished: () => {},
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
            // Wait for expansion + glide (1s) + tiny buffer for handoff
            setTimeout(() => setIntroFinished(true), 1500)
        }
    }, 16)
    
    return () => clearInterval(fillTimer)
  }, [isLandingPage])

  return (
    <IntroContext.Provider value={{ isIntroFinished, setIntroFinished }}>
      <SidebarProvider>
        {/* The Evolving Intro Logo - Matches prompt requirements */}
        <AnimatePresence>
          {!isIntroFinished && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background pointer-events-none">
              <motion.div
                layoutId="master-logo"
                className="relative flex items-center"
                initial={false}
                animate={isExpanded ? { width: 420 } : { width: 144 }}
                transition={{ 
                    duration: 1.0, 
                    ease: [0.16, 1, 0.3, 1] 
                }}
              >
                {/* 1. Shield (Icon) - Always the anchor */}
                <div className="relative w-[144px] h-[144px] shrink-0 z-20 bg-background">
                    {/* Greyscale Base */}
                    <img 
                    src="/embedClubLogo-Dark.svg" 
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 hidden dark:block" 
                    />
                    <img 
                    src="/embedClubLogo-Light.svg" 
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 dark:hidden" 
                    />
                    
                    {/* Colored Fill */}
                    <div 
                    className="absolute inset-0 overflow-hidden" 
                    style={{ clipPath: `inset(${(1 - fillProgress) * 100}% 0 0 0)` }}
                    >
                        <img 
                        src="/embedClubLogo-Dark.svg" 
                        className="w-full h-full object-contain hidden dark:block" 
                        />
                        <img 
                        src="/embedClubLogo-Light.svg" 
                        className="w-full h-full object-contain dark:hidden" 
                        />
                    </div>
                </div>

                {/* 2. Banner Text - Slides out from behind */}
                <div className="absolute left-0 top-0 h-full w-[420px] pointer-events-none z-10 overflow-hidden">
                    <motion.div
                        initial={{ x: -280, opacity: 0 }}
                        animate={isExpanded ? { x: 0, opacity: 1 } : { x: -280, opacity: 0 }}
                        transition={{ 
                            duration: 1.2, 
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.2 // Slight delay for weighted feel
                        }}
                        className="w-full h-full"
                    >
                        {/* We use the full banner but clip the shield part so it doesn't overlap weirdly */}
                        <div className="w-full h-full" style={{ clipPath: 'inset(0 0 0 144px)' }}>
                             <img src="/embedClubBanner-Dark.svg" className="w-full h-full object-contain hidden dark:block" />
                             <img src="/embedClubBanner-Light.svg" className="w-full h-full object-contain dark:hidden" />
                        </div>
                    </motion.div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        <div className="hidden lg:block relative z-[50]">
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
