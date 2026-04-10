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

export type IntroStage = 'loading' | 'gliding' | 'complete'

export const IntroContext = React.createContext<{
  stage: IntroStage
  setStage: (stage: IntroStage) => void
}>({
  stage: 'complete',
  setStage: () => {},
})

export function SidebarShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/home' // Adjust as needed
  
  const [stage, setStage] = React.useState<IntroStage>(!isLandingPage ? 'complete' : 'loading')
  const [fillProgress, setFillProgress] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    if (!isLandingPage) {
        setStage('complete')
        return
    }

    setStage('loading')
    setIsExpanded(false)
    setFillProgress(0)

    const duration = 800
    const start = Date.now()
    
    const fillTimer = setInterval(() => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setFillProgress(progress)
        
        if (progress >= 1) {
            clearInterval(fillTimer)
            // Wait for fill to settle
            setTimeout(() => {
                setIsExpanded(true)
                // Start Glide Phase
                setTimeout(() => {
                    setStage('gliding')
                    // Final transition to complete after glide (1s duration)
                    setTimeout(() => setStage('complete'), 1100)
                }, 400) // Small pause at center before glide
            }, 200)
        }
    }, 16)
    
    return () => clearInterval(fillTimer)
  }, [isLandingPage])

  return (
    <IntroContext.Provider value={{ stage, setStage }}>
      <SidebarProvider>
        {/* The Evolving Intro Logo */}
        <AnimatePresence>
          {stage !== 'complete' && (
            <div 
              className={`fixed inset-0 flex items-center justify-center bg-background pointer-events-none ${
                stage === 'gliding' ? 'z-[5] bg-transparent' : 'z-[1000]'
              }`}
            >
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
                <div className="relative w-[144px] h-[144px] shrink-0 z-20 bg-background rounded-full overflow-hidden">
                    <img 
                    src="/embedClubLogo-Dark.svg" 
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 hidden dark:block" 
                    />
                    <img 
                    src="/embedClubLogo-Light.svg" 
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 dark:hidden" 
                    />
                    
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

                <div className="absolute left-0 top-0 h-full w-[420px] pointer-events-none z-10 overflow-hidden">
                    <motion.div
                        initial={{ x: -280, opacity: 0 }}
                        animate={isExpanded ? { x: 0, opacity: 1 } : { x: -280, opacity: 0 }}
                        transition={{ 
                            duration: 1.2, 
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.2
                        }}
                        className="w-full h-full"
                    >
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

        <div className="hidden lg:block relative z-40">
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
  const { stage } = React.useContext(IntroContext)

  return (
    <ScrollContainerContext.Provider value={scrollEl}>
      <ContentPanel ref={setScrollEl} borderless={borderless || isMobile}>
        <div className="h-full w-full relative">
          <AnimatePresence>
            {stage !== 'complete' && !isMobile ? (
              <motion.div
                key="intro-overlay"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-background z-50 flex items-center justify-center pointer-events-none"
              >
                <div className="text-[10px] tracking-[0.4em] uppercase opacity-20 font-bold">
                  Synchronizing System
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 'complete' || isMobile ? 1 : 0 }}
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
