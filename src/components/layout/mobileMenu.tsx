'use client'

import {
  Bot,
  Boxes,
  CalendarRange,
  ClipboardList,
  FolderGit2,
  Images,
  Info,
  LucideHome,
  Mail,
  MessageSquareText,
  School,
  Trophy,
  UsersRound,
} from 'lucide-react'
import dynamic from 'next/dynamic'

// StaggeredMenu pulls in gsap for its open/close choreography. It's mounted
// unconditionally on every page (this component lives in the shared shell),
// so a static import shipped a full animation engine to every visitor before
// anyone had even tapped the hamburger icon. Loaded on demand instead -
// `ssr:false` because it's pure client interaction with no meaningful
// server-rendered fallback.
const StaggeredMenu = dynamic(() => import('@/components/layout/staggeredMenu'), {
  ssr: false,
})

/**
 * The same destinations as the desktop sidebar, in the same order.
 *
 * Each item carries its respective Lucide icon from desktopMenu, with subtle
 * cluster dividers separating primary destinations, learning tools, showcase,
 * and club engagement links.
 *
 * Keep in step with `desktopMenu.tsx` - a page reachable from one and not the
 * other is the bug this list exists to prevent.
 */
const navItems = [
  // Primary
  { label: 'HOME', ariaLabel: 'Home', link: '/', icon: LucideHome },
  { label: 'EVENTS', ariaLabel: 'Events', link: '/events', icon: CalendarRange },
  {
    label: 'ACHIEVEMENTS',
    ariaLabel: 'Achievements',
    link: '/achievements',
    icon: Trophy,
    dividerAfter: true,
  },

  // Learning
  { label: 'RESOURCES', ariaLabel: 'Resources', link: '/resources', icon: Boxes },
  { label: 'TUTORIALS', ariaLabel: 'Tutorials', link: '/tutorials', icon: School },
  {
    label: 'SIMULATORS',
    ariaLabel: 'Simulators',
    link: '/simulators',
    icon: Bot,
    dividerAfter: true,
  },

  // Showcase & Community
  { label: 'PROJECTS', ariaLabel: 'Projects', link: '/projects', icon: FolderGit2 },
  { label: 'GALLERY', ariaLabel: 'Gallery', link: '/gallery', icon: Images },
  {
    label: 'MEMBERS',
    ariaLabel: 'Members',
    link: '/members',
    icon: UsersRound,
    dividerAfter: true,
  },

  // Club & Interaction
  { label: 'ABOUT', ariaLabel: 'About', link: '/about', icon: Info },
  { label: 'FORMS', ariaLabel: 'Forms', link: '/forms', icon: ClipboardList },
  { label: 'FEEDBACK', ariaLabel: 'Feedback', link: '/feedback', icon: MessageSquareText },
  { label: 'CONTACT', ariaLabel: 'Contact', link: '/contact', icon: Mail },
]

export default function MobileMenu() {
  return (
    <>
      {/* Transparent top strip: no background so the hero video shows through;
          it only carries the menu-toggle colour vars for each theme. */}
      <style jsx>{`
        @media (max-width: 1023px) {
          .mobile-menu-overlay {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 60px;
            background: transparent;
            z-index: 40;
            pointer-events: none;
            --sm-toggle-color: #111111;
            --sm-toggle-open-color: #000000;
          }
          :global(.dark) .mobile-menu-overlay {
            background: transparent;
            --sm-toggle-color: #ffffff;
            --sm-toggle-open-color: #ffffff;
          }
        }
      `}</style>

      <div className="mobile-menu-overlay" />

      <div className="fixed top-3 right-3 z-50 lg:hidden flex items-center gap-1">
        <StaggeredMenu
          position="right"
          items={navItems}
          displaySocials={false}
          displayItemNumbering={false}
          isFixed
          logoLightUrl="/embedClubLogo-Light.svg"
          logoDarkUrl="/embedClubLogo-Dark.svg"
          menuButtonColor="var(--sm-toggle-color, #111)"
          openMenuButtonColor="var(--sm-toggle-open-color, #fff)"
          colors={['#111', '#1f1f1f', '#d98e4a']}
          accentColor="#d98e4a"
          closeOnClickAway
        />
      </div>
    </>
  )
}
