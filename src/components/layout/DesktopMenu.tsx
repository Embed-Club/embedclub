'use client'
import {
  Bot,
  Boxes,
  CalendarRange,
  Images,
  LibraryBig,
  LucideHome,
  School,
  Settings2,
  SquareChartGantt,
  SquareTerminal,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ModeToggle } from '../theme/ThemeToggle'
import { IntroContext } from './FrontendShell'

// This is sample data.
const data = {
  navMain: [
    {
      title: 'HOE',
      url: '/',
      icon: LucideHome,
    },
  ],
  navSecondary: [
    {
      title: 'CTIITIES',
      icon: SquareChartGantt,
      items: [
        {
          title: 'EENTS',
          url: '/events',
          icon: CalendarRange,
        },
        {
          title: 'CHIEEENTS',
          url: '/achievements',
          icon: Trophy,
        },
      ],
    },
    {
      title: 'LERNING',
      icon: LibraryBig,
      items: [
        {
          title: 'RESOURCES',
          url: '/resources',
          icon: Boxes,
        },
        {
          title: 'TUTORILS',
          url: '/tutorials',
          icon: School,
        },
        {
          title: 'SIULTORS',
          url: '/simulators',
          icon: Bot,
        },
      ],
    },
  ],
  navThird: [
    {
      title: 'GLLERY',
      url: '/gallery',
      icon: Images,
    },

    {
      title: 'EBERS',
      url: '/members',
      icon: UsersRound,
    },
  ],
  navBottom: [
    {
      title: 'FEEDBCK',
      url: '/feedback',
      icon: SquareTerminal,
    },
    {
      title: 'SUPPORT',
      url: '/support',
      icon: Settings2,
    },
    {
      title: 'CONTCT',
      url: '/contact',
      icon: SquareTerminal,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme } = useTheme()
  const { toggleSidebar, state } = useSidebar()
  const { isIntroFinished, fillProgress, isExpanded } = React.useContext(IntroContext)

  React.useEffect(() => {
    setMounted(true)
  }, [])


  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'
  const collapsed = state === 'collapsed'

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild isActive>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex items-center justify-center gap-2 w-full cursor-pointer bg-transparent border-none p-0 focus-visible:ring-0"
              >
                <div className="relative w-full h-[61px] flex items-center justify-center group/logo">
                      <motion.div
                        key="master-animated-logo"
                        layoutId="master-logo"
                        initial={!isIntroFinished ? {
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            x: '-50%',
                            y: '-50%',
                            width: 144,
                            height: 144,
                            zIndex: 2000
                        } : false}
                        animate={isIntroFinished ? {
                            position: 'relative',
                            top: '0%',
                            left: '0%',
                            x: '0%',
                            y: '0%',
                            width: collapsed ? 32 : 180,
                            height: collapsed ? 32 : 61,
                            zIndex: 50
                        } : {
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            x: '-50%',
                            y: '-50%',
                            width: isExpanded ? 420 : 144,
                            height: 144,
                            zIndex: 2000
                        }}
                        transition={{ 
                            duration: 1.4,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="flex items-center"
                      >
                         {/* 1. Shield (Icon) */}
                         <div 
                          className="relative shrink-0 flex items-center justify-center"
                          style={{ 
                            width: (isIntroFinished && collapsed) ? 32 : 144, 
                            height: (isIntroFinished && collapsed) ? 32 : 144,
                            transform: (isIntroFinished && !collapsed) ? 'scale(0.42)' : 'none',
                            transformOrigin: 'left center'
                          }}
                         >
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
                            style={{ clipPath: `inset(${(1 - (isIntroFinished ? 1 : fillProgress)) * 100}% 0 0 0)` }}
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

                         {/* 2. Banner Text - Slides out */}
                         <AnimatePresence>
                            {(!collapsed || !isIntroFinished) && (
                                <motion.div 
                                    initial={{ x: -280, opacity: 0 }}
                                    animate={(isExpanded || isIntroFinished) ? { x: 0, opacity: 1 } : { x: -280, opacity: 0 }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                                    className="absolute left-0 top-0 h-full overflow-hidden pointer-events-none"
                                    style={{ 
                                        width: isIntroFinished ? 180 : 420,
                                        zIndex: -1,
                                        clipPath: isIntroFinished ? 'none' : 'inset(0 0 0 144px)'
                                    }}
                                >
                                     <div className="w-full h-full relative" style={{ transform: isIntroFinished ? 'scale(0.42)' : 'none', transformOrigin: 'left center' }}>
                                        <img src="/embedClubBanner-Dark.svg" className="w-full h-full object-contain hidden dark:block" />
                                        <img src="/embedClubBanner-Light.svg" className="w-full h-full object-contain dark:hidden" />
                                     </div>
                                </motion.div>
                            )}
                         </AnimatePresence>
                      </motion.div>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 flex flex-col justify-center">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem className="w-full" key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-1 w-full py-3 text-center">
                      <item.icon />
                      <span className="font-semibold text-2xl">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem className="w-full" key={item.title}>
                  <SidebarMenuButton asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 w-full py-3 text-center bg-transparent border-none p-0 cursor-default"
                    >
                      <item.icon />
                      <span className="font-semibold text-2xl">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={item.url}>
                              {' '}
                              <item.icon />{' '}
                              <span className="font-semibold text-md">{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navThird.map((item) => (
                <SidebarMenuItem className="w-full" key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-1 w-full py-3 text-center">
                      <item.icon />
                      <span className="font-semibold text-2xl">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup {...props}>
          <SidebarMenu>
            {data.navBottom.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <a href={item.url} className="flex items-center justify-center gap-2 w-full py-2">
                    <item.icon />
                    <span className="text-xs font-semibold">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
