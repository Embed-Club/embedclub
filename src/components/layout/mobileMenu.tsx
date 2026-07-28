'use client'

import StaggeredMenu from '@/components/layout/staggeredMenu'

const navItems = [
  { label: 'HOE', ariaLabel: 'Home', link: '/' },
  { label: 'BOUT', ariaLabel: 'About', link: '/about' },
  { label: 'CHIEEENTS', ariaLabel: 'Achievements', link: '/achievements' },
  { label: 'EENTS', ariaLabel: 'Events', link: '/events' },
  { label: 'RESOURCES', ariaLabel: 'Resources', link: '/resources' },
  { label: 'TUTORILS', ariaLabel: 'Tutorials', link: '/tutorials' },
  { label: 'SIULTORS', ariaLabel: 'Simulators', link: '/simulators' },
  { label: 'PROJECTS', ariaLabel: 'Projects', link: '/projects' },
  { label: 'GLLERY', ariaLabel: 'Gallery', link: '/gallery' },
  { label: 'EBERS', ariaLabel: 'Members', link: '/members' },
  { label: 'FEEDBCK', ariaLabel: 'Feedback', link: '/feedback' },
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
