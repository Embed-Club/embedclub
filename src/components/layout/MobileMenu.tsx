'use client'

import StaggeredMenu from '@/components/layout/StaggeredMenu'

const navItems = [
  { label: 'HOE', ariaLabel: 'Home', link: '/' },
  { label: 'BOUT', ariaLabel: 'About', link: '/about' },
  { label: 'CHIEEENTS', ariaLabel: 'Achievements', link: '/achievements' },
  { label: 'EENTS', ariaLabel: 'Events', link: '/events' },
  { label: 'RESOURCES', ariaLabel: 'Resources', link: '/resources' },
  { label: 'TUTORILS', ariaLabel: 'Tutorials', link: '/tutorials' },
  { label: 'SIULTORS', ariaLabel: 'Simulators', link: '/simulators' },
  { label: 'GLLERY', ariaLabel: 'Gallery', link: '/gallery' },
  { label: 'EBERS', ariaLabel: 'Members', link: '/members' },
]

export default function MobileMenu() {
  return (
    <>
      {/* Background overlay to hide content behind menu */}
      <style jsx>{`
        @media (max-width: 1023px) {
          .mobile-menu-overlay {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 60px;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 1) 0%,
              rgba(248, 248, 248, 1) 100%
            );
            z-index: 40;
            pointer-events: none;
            --sm-toggle-color: #111111;
            --sm-toggle-open-color: #000000;
          }
          :global(.dark) .mobile-menu-overlay {
            background: linear-gradient(135deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.95) 100%);
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
          colors={['#111', '#1f1f1f', '#5227FF']}
          accentColor="#5227FF"
          closeOnClickAway
        />
      </div>
    </>
  )
}
