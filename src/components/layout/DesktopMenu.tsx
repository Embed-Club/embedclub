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


  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'system'
  const collapsed = state === 'collapsed'

  const logoHeader = (
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
                    {/* The Sidebar Logo Target - We use layoutId to "dock" the singleton logo here */}
                    <div className="relative w-[180px] h-full flex items-center justify-center">
                        <motion.div
                            layoutId="master-logo"
                            className="relative w-full h-full"
                            transition={{ 
                                duration: 1.0,
                                ease: [0.16, 1, 0.3, 1]
                            }}
                        >
                            <Image
                                src={isDark ? '/embedClubBanner-Dark.svg' : '/embedClubBanner-Light.svg'}
                                alt="Logo"
                                fill
                                priority
                                unoptimized
                                className="object-contain"
                            />
                        </motion.div>
                    </div>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
  )

  if (!mounted) {
    return (
        <Sidebar variant="floating" collapsible="icon" {...props}>
          {logoHeader}
        </Sidebar>
    )
  }
  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      {logoHeader}
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
