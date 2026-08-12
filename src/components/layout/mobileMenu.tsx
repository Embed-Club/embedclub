'use client'

import dynamic from 'next/dynamic'

// StaggeredMenu pulls in gsap for its open/close choreography. It's mounted
// unconditionally on every page (this component lives in the shared shell),
// so a static import shipped a full animation engine to every visitor before
// anyone had even tapped the hamburger icon. Loaded on demand instead —
// `ssr:false` because it's pure client interaction with no meaningful
// server-rendered fallback.
const StaggeredMenu = dynamic(() => import('@/components/layout/staggeredMenu'), {
  ssr: false,
})

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
  { label: 'FORS', ariaLabel: 'Forms', link: '/forms' },
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
