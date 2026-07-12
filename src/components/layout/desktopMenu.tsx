'use client'
import { InlineSVG } from '@/components/layout/inlineSvg'
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
import { AnimatePresence, motion } from 'motion/react'
import { useTheme } from 'next-themes'
import * as React from 'react'

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
import { IntroContext } from './frontendShell'

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
      title: 'BOUT',
      url: '/about',
      icon: UsersRound,
    },
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
                  <AnimatePresence mode="wait">
                    {isIntroFinished && !collapsed ? (
                      <motion.div
                        key="expanded"
                        layoutId="master-logo"
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.0,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="relative w-[180px] h-full overflow-hidden"
                      >
                        {/* Full banner SVG — logo + text. InlineSVG so Gobold @font-face loads */}
                        <InlineSVG
                          src="/EmbedClubBanner-Dark.svg"
                          className="w-full h-full hidden dark:block [&>svg]:w-full [&>svg]:h-full"
                        />
                        <InlineSVG
                          src="/EmbedClubBanner-Light.svg"
                          className="w-full h-full block dark:hidden [&>svg]:w-full [&>svg]:h-full"
                        />
                      </motion.div>
                    ) : isIntroFinished && collapsed ? (
                      <motion.div
                        key="collapsed"
                        layoutId="master-logo"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-8 h-8"
                      >
                        {/* Logo-only SVG is simple paths, no font needed — Image is fine here */}
                        <img
                          src={isDark ? '/embedClubLogo-Dark.svg' : '/embedClubLogo-Light.svg'}
                          alt="EmbedClub"
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                    ) : null}
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
          {/* Same markup as the middle sub-navs (RESOURCES, TUTORILS, …) so both
              sections share alignment, size, and hover styling */}
          <SidebarMenu>
            <SidebarMenuItem className="w-full">
              <SidebarMenuSub>
                {data.navBottom.map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton asChild>
                      <a href={item.url}>
                        {' '}
                        <item.icon /> <span className="font-semibold text-md">{item.title}</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
