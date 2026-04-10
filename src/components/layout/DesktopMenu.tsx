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
  const { isIntroFinished } = React.useContext(IntroContext)

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
                <div className="relative w-full h-[61px] flex items-center justify-center">
                  <AnimatePresence>
                    {!collapsed ? (
                      <motion.div
                        key="expanded"
                        layoutId="master-logo"
                        animate={{ opacity: isIntroFinished ? 1 : 0 }}
                        transition={{ 
                            duration: 1.0,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="relative w-[180px] h-full"
                      >
                         <Image
                          src={isDark ? '/embedClubBanner-Dark.svg' : '/embedClubBanner-Light.svg'}
                          alt="Expanded Logo"
                          fill
                          priority
                          unoptimized
                          className="object-contain"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        layoutId="master-logo"
                        animate={{ opacity: isIntroFinished ? 1 : 0, scale: isIntroFinished ? 1 : 0.5 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-8 h-8"
                      >
                        <Image
                          src={isDark ? '/embedClubLogo-Dark.svg' : '/embedClubLogo-Light.svg'}
                          alt="Collapsed Logo"
                          fill
                          priority
                          unoptimized
                          className="object-contain"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
