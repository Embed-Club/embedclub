'use client'
import { InlineSVG } from '@/components/layout/inlineSvg'
import {
  Bot,
  Boxes,
  CalendarRange,
  ClipboardList,
  FolderGit2,
  Images,
  Info,
  LibraryBig,
  LucideHome,
  type LucideIcon,
  Mail,
  MessageSquareText,
  School,
  SquareChartGantt,
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
      title: 'HOME',
      url: '/',
      icon: LucideHome,
    },
  ],
  navSecondary: [
    {
      title: 'ACTIVITIES',
      icon: SquareChartGantt,
      items: [
        {
          title: 'EVENTS',
          url: '/events',
          icon: CalendarRange,
        },
        {
          title: 'ACHIEVEMENTS',
          url: '/achievements',
          icon: Trophy,
        },
      ],
    },
    {
      title: 'LEARNING',
      icon: LibraryBig,
      items: [
        {
          title: 'RESOURCES',
          url: '/resources',
          icon: Boxes,
        },
        {
          title: 'TUTORIALS',
          url: '/tutorials',
          icon: School,
        },
        {
          title: 'SIMULATORS',
          url: '/simulators',
          icon: Bot,
        },
      ],
    },
  ],
  navThird: [
    {
      // Plain ASCII: unlike the neighbouring labels, PROJECTS has no A/M/V, so
      // it needs none of the private-use codepoints the display font maps.
      title: 'PROJECTS',
      url: '/projects',
      icon: FolderGit2,
    },
    {
      title: 'GALLERY',
      url: '/gallery',
      icon: Images,
    },

    {
      title: 'MEMBERS',
      url: '/members',
      icon: UsersRound,
    },
  ],
  navBottom: [
    {
      title: 'ABOUT',
      url: '/about',
      icon: Info,
    },
    {
      title: 'FORMS',
      url: '/forms',
      icon: ClipboardList,
    },
    {
      title: 'FEEDBACK',
      url: '/feedback',
      icon: MessageSquareText,
    },
    {
      title: 'CONTACT',
      url: '/contact',
      icon: Mail,
    },
  ],
}

type NavLeaf = { title: string; url: string; icon: LucideIcon }

/**
 * Collapsed-rail item: a copper name-tab rooted in the rail *behind* the icon
 * that wipes outward on hover, so it reads as the sidebar itself extending over
 * the page content (not a detached pill). The tab starts at the rail's left
 * padding, sits under the icon, and its right end rounds off past the rail edge
 * - one continuous shape with no gap. The rail's SidebarContent is set to
 * overflow-visible while collapsed so the tab can escape the rail.
 */
function CollapsedNavItem({ title, url, icon: Icon }: NavLeaf) {
  return (
    <SidebarMenuItem className="w-full">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-full z-0 ml-2 flex items-center whitespace-nowrap rounded-r-full border border-l-0 border-sidebar-border bg-sidebar texture-panel px-5 font-semibold text-xl text-sidebar-foreground opacity-0 shadow-[6px_4px_16px_-6px_rgba(0,0,0,0.3)] [clip-path:inset(0_100%_0_0)] transition-all duration-300 ease-out group-hover/menu-item:opacity-100 group-hover/menu-item:[clip-path:inset(0_0_0_0)]"
      >
        {title}
      </span>
      <SidebarMenuButton
        asChild
        className="relative z-10 hover:!bg-transparent hover:!text-sidebar-foreground"
      >
        <a href={url} className="flex items-center justify-center py-3">
          <Icon />
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
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
                        {/* Full banner SVG - logo + text. InlineSVG so Gobold @font-face loads */}
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
                        {/* Logo-only SVG is simple paths, no font needed - Image is fine here */}
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
      <SidebarContent className="flex-1 flex flex-col justify-center group-data-[collapsible=icon]:!overflow-visible">
        {collapsed ? (
          // Collapsed rail: every navigable leaf as an icon with a hover-reveal
          // label pill. The non-clickable group headers (Activities / Learning)
          // are dropped in favour of their items.
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  ...data.navMain,
                  ...data.navSecondary.flatMap((group) => group.items ?? []),
                  ...data.navThird,
                ].map((item) => (
                  <CollapsedNavItem key={item.title} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem className="w-full" key={item.title}>
                    <SidebarMenuButton asChild>
                      <a
                        href={item.url}
                        className="flex items-center gap-1 w-full py-3 text-center"
                      >
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
                {data.navSecondary.map((group) => (
                  <SidebarMenuItem className="w-full" key={group.title}>
                    <SidebarMenuButton asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 w-full py-3 text-center bg-transparent border-none p-0 cursor-default"
                      >
                        <group.icon />
                        <span className="font-semibold text-2xl">{group.title}</span>
                      </button>
                    </SidebarMenuButton>
                    {group.items?.length ? (
                      <SidebarMenuSub>
                        {group.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={sub.url}>
                                {' '}
                                <sub.icon />{' '}
                                <span className="font-semibold text-md">{sub.title}</span>
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
                      <a
                        href={item.url}
                        className="flex items-center gap-1 w-full py-3 text-center"
                      >
                        <item.icon />
                        <span className="font-semibold text-2xl">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* p-0 when collapsed: SidebarFooter already pads 8px, so the extra
            group padding would push footer icons 8px right of the content icons. */}
        <SidebarGroup {...props} className="group-data-[collapsible=icon]:p-0">
          {/* Same markup as the middle sub-navs (RESOURCES, TUTORILS, …) so both
              sections share alignment, size, and hover styling. Collapsed: the
              SidebarMenuSub is icon-hidden, so render the items as icon buttons
              (matching navMain) so they stay reachable. */}
          <SidebarMenu>
            {collapsed ? (
              data.navBottom.map((item) => <CollapsedNavItem key={item.title} {...item} />)
            ) : (
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
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
