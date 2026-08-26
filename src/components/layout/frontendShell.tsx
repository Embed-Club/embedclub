'use client'

import { AudioToggle } from '@/components/common/backgroundAudio'
import { ContentPanel } from '@/components/layout/contentPanel'
import { AppSidebar } from '@/components/layout/desktopMenu'
import { InlineSVG } from '@/components/layout/inlineSvg'
import MobileMenu from '@/components/layout/mobileMenu'
import { ModeToggle } from '@/components/theme/themeToggle'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/useMobile'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { ScrollContainerContext } from './scrollContainerContext'
import { SiteFooter } from './siteFooter'

export const IntroContext = React.createContext<{
  isIntroFinished: boolean
  setIntroFinished: (finished: boolean) => void
}>({
  isIntroFinished: false,
  setIntroFinished: () => {},
})

export function SidebarShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/home'
  const [isIntroFinished, setIntroFinished] = React.useState(!isLandingPage)
  const [fillProgress, setFillProgress] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showIntroOverlay, setShowIntroOverlay] = React.useState(isLandingPage)
  const [isOverlayFading, setIsOverlayFading] = React.useState(false)
  const [dockTarget, setDockTarget] = React.useState<{
    x: number
    y: number
    scaleX: number
    scaleY: number
  } | null>(null)
  // Full expanded lockup is 460px wide; scale it down so it never overflows
  // small viewports (e.g. 414px phones cut the banner off otherwise).
  const [introScale, setIntroScale] = React.useState(1)

  React.useEffect(() => {
    const compute = () => setIntroScale(Math.min(1, (window.innerWidth - 32) / 460))
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  React.useEffect(() => {
    const root = document.documentElement

    if (!isLandingPage) {
      root.dataset.introReady = 'true'
      setIntroFinished(true)
      setShowIntroOverlay(false)
      return () => {
        delete root.dataset.introReady
      }
    }

    delete root.dataset.introReady
    setIntroFinished(false)
    setIsExpanded(false)
    setFillProgress(0)
    setShowIntroOverlay(true)
    setIsOverlayFading(false)
    setDockTarget(null)

    // The intro is one continuous choreography: fill, expand, dock, then reveal
    // the page underneath the fading curtain.
    const duration = 350
    const start = Date.now()

    let expandTimer: ReturnType<typeof setTimeout> | undefined
    let dockTimer: ReturnType<typeof setTimeout> | undefined
    let revealTimer: ReturnType<typeof setTimeout> | undefined

    const fillTimer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setFillProgress(progress)

      if (progress >= 1) {
        clearInterval(fillTimer)
        expandTimer = setTimeout(() => {
          setIsExpanded(true)

          const target = document.querySelector<HTMLElement>('[data-embed-logo-target]')
          const rect = target?.getBoundingClientRect()
          if (rect && rect.width > 0 && rect.height > 0) {
            const nextDockTarget = {
              x: rect.left + rect.width / 2 - window.innerWidth / 2,
              y: rect.top + rect.height / 2 - window.innerHeight / 2,
              scaleX: rect.width / 460,
              scaleY: rect.height / 144,
            }

            // Give the text reveal time to complete and hold as a full lockup
            // before the entire logo begins its spatial handoff.
            dockTimer = setTimeout(() => setDockTarget(nextDockTarget), 900)
          }
        }, 50)

        // The reveal follows the full logo travel, not the text expansion.
        revealTimer = setTimeout(() => {
          root.dataset.introReady = 'true'
          setIntroFinished(true)
          setIsOverlayFading(true)
        }, 1950)
      }
    }, 16)

    return () => {
      clearInterval(fillTimer)
      if (expandTimer) clearTimeout(expandTimer)
      if (dockTimer) clearTimeout(dockTimer)
      if (revealTimer) clearTimeout(revealTimer)
      delete root.dataset.introReady
    }
  }, [isLandingPage])

  return (
    <IntroContext.Provider value={{ isIntroFinished, setIntroFinished }}>
      {/* Bind the shell to exactly one viewport. Without this the shadcn wrapper
          is `min-h-svh` (grows with content), so ContentPanel never bounds - the
          body scrolls AND the panel scrolls (two scrollbars) and the footer's
          clientHeight measurement feeds a ResizeObserver growth loop. Fixing the
          height makes ContentPanel the single, bounded scroll container. */}
      <SidebarProvider className="h-svh overflow-hidden">
        {/* The logo stays in one visual system while the curtain fades behind it. */}
        {showIntroOverlay && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isOverlayFading ? 0 : 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => {
              if (isOverlayFading) setShowIntroOverlay(false)
            }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-background pointer-events-none"
          >
            {/* The lockup keeps a constant 460px box so it is always centred:
                  introScale is computed against that width, so the whole thing
                  sits inside the viewport with 16px to spare at every frame.
                  Animating the box's width instead (144 -> 440) centred it only
                  once the animation finished - while it was still narrow, its
                  centred left edge pushed the left-anchored 460px banner off the
                  right of small screens, cutting the text mid-reveal.
                  shrink-0 matters too: the overlay is a flex container narrower
                  than 460px on phones, and without it the lockup is compressed
                  to the viewport width, which breaks the scale maths. */}
            <motion.div
              className="relative h-[144px] w-[460px] shrink-0 overflow-hidden"
              initial={{ scaleX: introScale, scaleY: introScale }}
              animate={
                dockTarget
                  ? {
                      x: dockTarget.x,
                      y: dockTarget.y,
                      scaleX: dockTarget.scaleX,
                      scaleY: dockTarget.scaleY,
                    }
                  : { scaleX: introScale, scaleY: introScale }
              }
              transition={{
                duration: 0.95,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shield and banner slide as one group, so the shield stays
                    flush with the banner's left edge and keeps masking it - it
                    is the mask, being opaque and z-20 over the z-10 banner.
                    Moving the shield alone would uncover the box's left 158px
                    and expose the text sitting there before it slides out.
                    x=158 (230 - 72) puts the shield's centre on the box's, so
                    collapsed still reads as a centred shield. */}
              <motion.div
                className="relative flex h-full w-full items-center"
                initial={false}
                animate={{ x: isExpanded ? 0 : 158 }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* 1. Shield (Icon) - Always the anchor */}
                <div className="relative w-[144px] h-[144px] shrink-0 z-20 bg-background">
                  {/* Greyscale Base */}
                  <img
                    alt=""
                    src="/embedClubLogo-Dark.svg"
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 hidden dark:block"
                  />
                  <img
                    alt=""
                    src="/embedClubLogo-Light.svg"
                    className="absolute inset-0 w-full h-full object-contain grayscale opacity-10 dark:hidden"
                  />

                  {/* Colored Fill */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(${(1 - fillProgress) * 100}% 0 0 0)` }}
                  >
                    <img
                      alt=""
                      src="/embedClubLogo-Dark.svg"
                      className="w-full h-full object-contain hidden dark:block"
                    />
                    <img
                      alt=""
                      src="/embedClubLogo-Light.svg"
                      className="w-full h-full object-contain dark:hidden"
                    />
                  </div>
                </div>

                {/* 2. Banner Text - Slides out from behind the icon */}
                {/* w-[460px] + clip at 120px = 340px of visible text area */}
                {/* Clip at 120px (not 144) so the "E" in EMBED isn't cut off */}
                <div className="absolute left-0 top-0 h-full w-[460px] pointer-events-none z-10 overflow-hidden">
                  <motion.div
                    initial={{ x: -296, opacity: 0 }}
                    animate={isExpanded ? { x: 0, opacity: 1 } : { x: -296, opacity: 0 }}
                    transition={{
                      duration: 0.85,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.05,
                    }}
                    className="w-full h-full"
                  >
                    {/* Use the path-converted public artwork directly. */}
                    <div className="w-full h-full" style={{ clipPath: 'inset(0 0 0 120px)' }}>
                      <InlineSVG
                        src="/EmbedClubBanner-Dark.svg"
                        className="w-full h-full hidden dark:block [&>svg]:w-full [&>svg]:h-full"
                      />
                      <InlineSVG
                        src="/EmbedClubBanner-Light.svg"
                        className="w-full h-full block dark:hidden [&>svg]:w-full [&>svg]:h-full"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        <div className="hidden lg:block relative z-[50]">
          <AppSidebar />
        </div>
        <MobileMenu />
        <div className="absolute right-8 top-6 z-40 hidden lg:flex items-center gap-2">
          <AudioToggle />
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
  /** Hide the scroll container's scrollbar while keeping it scrollable. */
  hideScrollbar?: boolean
}

export { ScrollContainerContext }

export function MainbarShell({ children, borderless, hideScrollbar }: MainbarShellProps) {
  const isMobile = useIsMobile()
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)

  // Page content is painted as it arrives. It used to be held at opacity 0
  // behind a masking overlay and faded in over 0.8s - on the landing page that
  // waited out the logo glide, but every other page paid the same delay for an
  // intro that was not running, so each load opened on a blank panel.
  return (
    <ScrollContainerContext.Provider value={scrollEl}>
      <ContentPanel
        ref={setScrollEl}
        borderless={borderless || isMobile}
        hideScrollbar={hideScrollbar}
      >
        {/* min-h-full (not h-full) so tall pages grow past one viewport and the
            footer flows below them instead of overlapping overflowed content. */}
        <div className="min-h-full w-full relative">{children}</div>
        <SiteFooter />
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
