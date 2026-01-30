"use client"
import Image from "next/image"
import Link from 'next/link'
import * as React from "react"
import { useTheme } from 'next-themes'
import {
  LucideHome,
  Bot,
  Settings2,
  SquareTerminal,
  SquareChartGantt,
  CalendarRange,
  Trophy,
  LibraryBig,
  Boxes,
  School,
  Images,
  UsersRound
} from "lucide-react"

import {
  Sidebar,
  useSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"



// This is sample data.
const data = {
  navMain: [
    {
      title: "HOE",
      url: "/dashboard",
      icon: LucideHome,
    },
  ],
  navSecondary: [
    {
      title: "CTIITIES",
      icon: SquareChartGantt,
      items: [
        {
          title: "EENTS",
          url: "/events",
          icon: CalendarRange,
        },
        {
          title: "CHIEEENTS",
          url: "/achievements",
          icon: Trophy,
        },
      ],
    },
    {
      title: "LERNING",
      icon: LibraryBig,
      items: [
        {
          title: "RESOURCES",
          url: "/resources",
          icon: Boxes,
        },
        {
          title: "TUTORILS",
          url: "/tutorials",
          icon: School,
        },
        {
          title: "SIULTORS",
          url: "/simulators",
          icon: Bot,
        },
      ],
    },
  ],
  navThird:[

    {
      title: "GLLERY",
      url: "/gallery",
      icon: Images,
    },

    {
      title: "EBERS",
      url: "/members",
      icon: UsersRound,
    },

  ],
  navBottom: [
      {
      title: "FEEDBCK",
      url: "/feedback",
      icon: SquareTerminal,
    },
    {
      title: "SUPPORT",
      url: "/support",
      icon: Settings2,
    },
    {
      title: "CONTCT",
      url: "/contact",
      icon: SquareTerminal,
    },
    
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const { toggleSidebar, state } = useSidebar();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log theme changes
  React.useEffect(() => {
    if (mounted) {

    }
  }, [resolvedTheme, mounted]);

  // Wait for theme to hydrate
  if (!mounted) {
    return null;
  }

  // Use resolvedTheme which handles system theme automatically
  const isDark = resolvedTheme === "dark";
  const collapsed = state === "collapsed";

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild isActive >

              <a onClick={toggleSidebar} href="#" className="flex items-center justify-center gap-2 w-full">
                <div className="relative w-[180px] h-[61px] transition-all duration-300">
                  <Image
                    key={`expanded-${isDark}-${collapsed}`}
                    src={isDark ? "/embedClubBanner-Dark.png" : "/embedClubBanner-Light.png"}
                    alt="Expanded Logo"
                    fill
                    priority
                    unoptimized
                    className={`object-contain absolute transition-opacity duration-300 ${
                      collapsed ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <Image
                    key={`collapsed-${isDark}-${collapsed}`}
                    src={isDark ? "/embedClubLogo-Dark.png" : "/embedClubLogo-Light.png"}
                    alt="Collapsed Logo"
                    fill
                    priority
                    unoptimized
                    className={`object-contain absolute transition-opacity duration-300 ${
                      collapsed ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </a>
              
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 flex flex-col justify-center" >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu >
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
                    <a className="flex items-center gap-1 w-full py-3 text-center">
                      <item.icon />
                      <span className="font-semibold text-2xl">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>

                          <a href={item.url}> <item.icon /> <span className="font-semibold text-md">{item.title}</span></a>
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
            <SidebarMenu >
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
