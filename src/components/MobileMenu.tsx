'use client'

import StaggeredMenu from '@/components/StaggeredMenu'

const navItems = [
  { label: 'Home', ariaLabel: 'Home', link: '/' },
  { label: 'chievements', ariaLabel: 'Achievements', link: '/achievements' },
  { label: 'Events', ariaLabel: 'Events', link: '/events' },
  { label: 'Resources', ariaLabel: 'Resources', link: '/resources' },
  { label: 'Tutorials', ariaLabel: 'Tutorials', link: '/tutorials' },
  { label: 'Simulators', ariaLabel: 'Simulators', link: '/simulators' },
  { label: 'Gllery', ariaLabel: 'Gallery', link: '/gallery' },
  { label: 'Members', ariaLabel: 'Members', link: '/members' }
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
            height: 80px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 248, 248, 1) 100%);
            z-index: 40;
            pointer-events: none;
          }
          :global(.dark) .mobile-menu-overlay {
            background: linear-gradient(135deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.95) 100%);
          }
        }
      `}</style>

      <div className="mobile-menu-overlay"></div>

      <div className="fixed top-3 right-3 z-50 lg:hidden flex items-center gap-2">
        <StaggeredMenu
          position="right"
          items={navItems}
          displaySocials={false}
          displayItemNumbering={false}
          isFixed
          logoLightUrl="/embedClubLogo-Light.png"
          logoDarkUrl="/embedClubLogo-Dark.png"
          menuButtonColor="#fff"
          openMenuButtonColor="#111"
          colors={['#111', '#1f1f1f', '#5227FF']}
          accentColor="#5227FF"
          closeOnClickAway
        />
      </div>
    </>
  )
}
