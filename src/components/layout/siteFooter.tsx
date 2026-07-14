'use client'

import { ScrollContainerContext } from '@/components/layout/scrollContainerContext'
import { cn } from '@/lib/utils'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ArrowUpRight } from 'lucide-react'
import { useContext, useEffect, useRef } from 'react'

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Events', href: '/events' },
      { label: 'Achievements', href: '/achievements' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Members', href: '/members' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'Resources', href: '/resources' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'Simulators', href: '/simulators' },
    ],
  },
  {
    heading: 'Club',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Feedback', href: '/feedback' },
      { label: 'Support', href: '/support' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

/**
 * Full-viewport footer that lives at the bottom of the scroll container on
 * every page. GSAP magnetically snaps the last scroll so the footer settles
 * fully into view once you scroll past its threshold.
 */
export function SiteFooter() {
  const scrollEl = useContext(ScrollContainerContext)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const scroller = scrollEl
    const section = sectionRef.current
    if (!scroller || !section) return

    gsap.registerPlugin(ScrollToPlugin)

    let snapping = false
    let settleTimer: ReturnType<typeof setTimeout>

    const settle = () => {
      if (snapping) return
      const vh = scroller.clientHeight
      const top = section.offsetTop
      const height = section.offsetHeight
      const hidden = top - vh // footer sits just below the viewport
      const shown = top + height - vh // footer fully in view (bottom-aligned)
      if (shown <= hidden) return

      const cur = scroller.scrollTop
      if (cur <= hidden || cur >= shown) return // not inside the footer band

      const progress = (cur - hidden) / (shown - hidden)
      if (progress <= 0.02 || progress >= 0.98) return

      // Magnetic bias toward the footer — reveal it from ~40% in, snap back below only near the top edge.
      const target = progress > 0.4 ? shown : hidden
      snapping = true
      gsap.to(scroller, {
        scrollTo: { y: target },
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          snapping = false
        },
      })
    }

    const onScroll = () => {
      if (snapping) return
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, 140)
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      clearTimeout(settleTimer)
      gsap.killTweensOf(scroller)
    }
  }, [scrollEl])

  return (
    // Full-page section: one viewport tall on every device (svh accounts for
    // mobile browser chrome) so scrolling to the bottom reveals the whole footer.
    <footer ref={sectionRef} className="relative flex min-h-[100svh] w-full flex-col p-4 md:p-8">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-sm">
        {/* Foreground content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between gap-10 p-6 md:p-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            {/* Brand */}
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <img
                  src="/embedClubLogo-Dark.svg"
                  alt=""
                  className="hidden h-9 w-9 object-contain dark:block"
                />
                <img
                  src="/embedClubLogo-Light.svg"
                  alt=""
                  className="h-9 w-9 object-contain dark:hidden"
                />
                <span className="text-lg font-bold uppercase tracking-[0.2em] text-foreground">
                  Embed Club
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Student-run embedded systems & IoT club at PA College of Engineering. We build,
                break, and ship — turning circuits and code into things that work.
              </p>
              <a
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get in touch
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.heading}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                    {col.heading}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>© 2026 Embed Club · PA College of Engineering, Mangalore</span>
            <span className="uppercase tracking-[0.3em]">Inspiring Innovation</span>
          </div>
        </div>

        {/* Giant copper wordmark, bleeding off the bottom edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
        >
          <span
            style={{ fontFamily: 'Gobold, sans-serif' }}
            className={cn(
              'translate-y-[28%] select-none text-[26vw] font-bold leading-none text-primary/25 md:text-[20vw]',
            )}
          >
            Embed
          </span>
        </div>
      </div>
    </footer>
  )
}
