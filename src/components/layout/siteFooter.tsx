import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Learn',
    links: [
      { label: 'Resources', href: '/resources' },
      { label: 'Tutorials', href: '/tutorials' },
    ],
  },
  {
    heading: 'Build',
    links: [
      { label: 'Projects', href: '/projects' },
      { label: 'Simulators', href: '/simulators' },
    ],
  },
  {
    heading: 'Participate',
    links: [
      { label: 'Events', href: '/events' },
      { label: 'Forms', href: '/forms' },
      { label: 'Feedback', href: '/feedback' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'Members', href: '/members' },
      { label: 'Achievements', href: '/achievements' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

/**
 * Full-viewport footer at the bottom of every page's scroll container. Plain
 * full-page section - no scroll snapping (free to scroll into and back out of).
 */
export function SiteFooter() {
  return (
    // Full-page section: one viewport tall on every device (svh accounts for
    // mobile browser chrome) so scrolling to the bottom reveals the whole footer.
    <footer className="relative flex min-h-[100svh] w-full flex-col p-4 md:p-8">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-sm">
        {/* Foreground content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between gap-10 p-6 md:p-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            {/* Brand */}
            <div className="max-w-md">
              {/* Full banner lockup (EMBED CLUB · Inspiring Innovation) */}
              <img
                src="/EmbedClubBanner-Dark.svg"
                alt="Embed Club"
                className="hidden h-10 w-auto object-contain dark:block md:h-12"
              />
              <img
                src="/EmbedClubBanner-Light.svg"
                alt="Embed Club"
                className="h-10 w-auto object-contain dark:hidden md:h-12"
              />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Student-run embedded systems & IoT club at PA College of Engineering. We build,
                break, and ship - turning circuits and code into things that work.
              </p>
              <a
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get in touch
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <div className="mt-5 flex items-center gap-4 text-sm font-semibold">
                <a
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </a>
                <a
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
              {COLUMNS.map((col) => (
                <div key={col.heading}>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary">
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

          {/* Institution: partner logos above the P.A. College address */}
          <div className="flex flex-col gap-5 border-t border-border pt-6">
            <div className="flex items-center gap-4">
              {/* White chips so the white-background logos read cleanly in both themes */}
              <div className="flex h-16 items-center justify-center rounded-xl bg-white px-3 shadow-sm">
                <img
                  src="/pace-logo.png"
                  alt="P.A. College of Engineering"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="flex h-16 items-center justify-center rounded-xl bg-white px-3 shadow-sm">
                <img
                  src="/pacesilvioralogo.png"
                  alt="PACE Silver Jubilee - 25 years"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">P.A. College of Engineering</span>
              <br />
              Nadupadav, Montepadav Post, Kairangala
              <br />
              Mangalore - 574153, Karnataka, INDIA
            </address>
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
