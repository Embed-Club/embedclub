'use client'

import { SPECIAL_THANKS } from '@/components/common/specialThanks'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { EventType } from './eventType'

const PAGE_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'The Brief', href: '#brief' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Tracks', href: '#tracks' },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Venue', href: '#venue' },
  { label: 'Register', href: '#register', isAccent: true },
]

const PARTNER_LINKS = [
  { label: 'GLUG PACE', href: 'https://glug.pace.ac.in' },
  { label: 'IEEE Mangalore', href: 'https://ieeemangalore.org' },
  { label: 'IEEE Bangalore', href: 'https://ieeebangalore.org' },
  { label: 'IEEE CEDA Chapter', href: 'https://ieee-ceda.org' },
  { label: 'Dept of CSE, PACE', href: 'https://pace.ac.in' },
]

/**
 * The partner marks, in the order the strip reads. Each is a transparent WebP cut
 * from the partner's own artwork. They are dark-on-light marks, so the strip sits
 * on a light bar inside the dark card instead of being recoloured.
 */
const PARTNER_LOGOS = [
  {
    name: 'GLUG PACE',
    src: '/glugLogo.webp',
    width: 198,
    height: 200,
    href: 'https://glug.pace.ac.in',
  },
  {
    name: 'IEEE Mangalore Subsection',
    src: '/ieeeMangaloreLogo.webp',
    width: 589,
    height: 128,
    href: 'https://ieeemangalore.org',
  },
  {
    name: 'IEEE Bangalore Section',
    src: '/ieeeBangaloreLogo.webp',
    width: 605,
    height: 128,
    href: 'https://ieeebangalore.org',
  },
  {
    name: 'IEEE Council on Electronic Design Automation',
    src: '/ieeeCedaLogo.webp',
    width: 490,
    height: 128,
    href: 'https://ieee-ceda.org',
  },
]

export function EmbedthonFooter({ event }: { event: EventType }) {
  return (
    <footer className="light relative z-10 w-full overflow-hidden bg-background pt-[clamp(1.5rem,4svh,3rem)] pb-4 text-foreground">
      <style>{`
        .embers-footer-card {
          mask-image: url(/embersFooterMaskMobile.svg);
          -webkit-mask-image: url(/embersFooterMaskMobile.svg);
          mask-size: 100% 100%;
          -webkit-mask-size: 100% 100%;
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
        }
        @media (min-width: 768px) {
          .embers-footer-card {
            mask-image: url(/embersFooterMask.svg);
            -webkit-mask-image: url(/embersFooterMask.svg);
          }
        }
      `}</style>
      <div className="mx-auto w-full max-w-[1536px] px-3 sm:px-6 lg:px-8">
        {/* The signature masked card silhouette (reverse-engineered from landonorris.com) */}
        <div className="embers-footer-card dark relative overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-2xl transition-all sm:rounded-[36px]">
          {/* Subtle topographic contour lines in copper token */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-primary/15 opacity-70 mix-blend-screen"
            style={{
              backgroundImage: 'url(/footerContours.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Radial ambient copper glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/4 h-[440px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[130px]"
          />

          {/* Top signature emblem, sitting straight on the card inside the elevated
              top tab: no plate behind it. It is the same transparent mark as the hero
              and the centrepiece, with a thin copper rim so its dark lettering still
              reads on the dark card. */}
          <div className="absolute top-1.5 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center sm:top-2.5">
            <Image
              src="/embersLogoBackdrop.webp"
              alt="Embed Club"
              width={1280}
              height={1326}
              className="size-9 object-contain sm:size-12 [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_6px_hsl(var(--primary)/0.3))]"
            />
          </div>

          {/* Content container with proper responsive clearance */}
          <div className="relative z-10 flex flex-col items-center px-4 pt-24 pb-12 sm:px-8 sm:pt-28 md:pt-[clamp(5rem,10svh,8rem)] md:pb-[clamp(1.5rem,3.5svh,5rem)] lg:px-14">
            {/* Main title: ALWAYS BRINGING THE EMBER */}
            <h2 className="text-center text-[clamp(2.2rem,min(5vw,7.5svh),5rem)] font-black uppercase leading-[0.92] tracking-[-0.03em] text-foreground">
              {event === 'embers' ? (
                <>
                  Always Bringing <br />
                  The <span className="text-primary">Ember.</span>
                </>
              ) : (
                <>
                  Learn it. Build it. <br />
                  <span className="text-primary">Ship it.</span>
                </>
              )}
            </h2>

            {/* Desktop: 3-column layout flanking the central visual */}
            <div className="mt-6 hidden w-full grid-cols-12 items-center gap-6 md:mt-[3svh] md:grid">
              {/* Left Column: Pages */}
              <div className="col-span-3 flex flex-col items-start text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                  Pages
                </p>
                <nav
                  aria-label="Footer pages"
                  className="mt-[1.6svh] flex flex-col space-y-[1.1svh]"
                >
                  {PAGE_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className={`text-[clamp(0.95rem,2.4svh,1.25rem)] font-bold uppercase tracking-tight transition-all duration-200 ${
                        link.isAccent
                          ? 'text-primary hover:text-primary/80 font-black'
                          : 'text-muted-foreground hover:translate-x-1 hover:text-primary'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Center Column: Focal Hardware Bust & Action Button */}
              <div className="col-span-6 flex flex-col items-center text-center">
                <div className="relative flex w-full items-center justify-center">
                  <Image
                    src="/embersLogoBackdrop.webp"
                    alt="Embers '26 logo"
                    width={1280}
                    height={1326}
                    priority
                    className="pointer-events-none h-[clamp(150px,24svh,330px)] w-auto select-none object-contain [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_12px_hsl(var(--primary)/0.28))]"
                  />
                </div>

                {/* Signature bottom-center button */}
                <a
                  href="#register"
                  className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground shadow-xl transition-all duration-300 hover:scale-[1.04] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Register for Embers &apos;26
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </a>
              </div>

              {/* Right Column: Partners & Societies */}
              <div className="col-span-3 flex flex-col items-end text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                  Partners &bull; Chapters
                </p>
                <nav
                  aria-label="Footer partners"
                  className="mt-[1.6svh] flex flex-col space-y-[1.1svh]"
                >
                  {PARTNER_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-[clamp(0.95rem,2.4svh,1.25rem)] font-bold uppercase tracking-tight text-muted-foreground transition-all duration-200 hover:text-primary"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Mobile: Centered visual + CTA, then 2-column links underneath */}
            <div className="mt-6 flex w-full flex-col items-center md:hidden">
              <div className="relative flex w-full items-center justify-center">
                <Image
                  src="/embersLogoBackdrop.webp"
                  alt="Embers '26 logo"
                  width={1280}
                  height={1326}
                  priority
                  className="pointer-events-none h-[clamp(150px,24svh,230px)] w-auto select-none object-contain [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_12px_hsl(var(--primary)/0.28))]"
                />
              </div>

              <a
                href="#register"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                Register for Embers &apos;26
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </a>

              <div className="mt-8 grid w-full grid-cols-2 gap-4 px-2 text-left">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Pages
                  </p>
                  <nav className="mt-2.5 flex flex-col space-y-1.5">
                    {PAGE_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className={`text-sm font-bold uppercase tracking-tight ${
                          link.isAccent ? 'text-primary font-black' : 'text-muted-foreground'
                        }`}
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Partners
                  </p>
                  <nav className="mt-2.5 flex flex-col space-y-1.5">
                    {PARTNER_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold uppercase tracking-tight text-muted-foreground"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Partner logos, then the college and its accreditation together at the
                bottom middle. Both sit on light bars so the dark-on-light marks read. */}
            <div className="mt-8 flex w-full flex-col items-center gap-3 border-t border-border pt-5 md:mt-[3.5svh] md:pt-[2.5svh]">
              <ul className="light grid w-full max-w-4xl grid-cols-2 place-items-center gap-x-4 gap-y-4 rounded-2xl bg-background px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:gap-y-3 sm:px-8 sm:py-2.5">
                {PARTNER_LOGOS.map((logo) => (
                  <li key={logo.name} className="flex w-full items-center justify-center sm:w-auto">
                    <a
                      href={logo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={logo.name}
                      className="flex transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Image
                        src={logo.src}
                        alt={logo.name}
                        width={logo.width}
                        height={logo.height}
                        className="h-8 max-w-full w-auto object-contain sm:h-[clamp(1.8rem,4.8svh,2.75rem)]"
                      />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="light flex items-center justify-center gap-5 rounded-2xl bg-background px-5 py-2 sm:gap-7 sm:px-7">
                <a
                  href="https://pace.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="P.A. College of Engineering"
                  className="flex transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src="/pace-logo.png"
                    alt="P.A. College of Engineering"
                    width={250}
                    height={266}
                    className="h-[clamp(2.5rem,6svh,3.5rem)] w-auto object-contain"
                  />
                </a>
                <Image
                  src="/naacLogo.webp"
                  alt="NAAC accredited with grade A"
                  width={204}
                  height={200}
                  className="h-[clamp(2.5rem,6svh,3.5rem)] w-auto object-contain"
                />
              </div>

              {/* Alumni who contributed to or sponsored this edition. */}
              {event === 'embers' && (
                <p className="max-w-2xl text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Special thanks to our alumni{' '}
                  {SPECIAL_THANKS.map((person, index) => (
                    <span key={person.name}>
                      <span className="font-semibold text-foreground">{person.name}</span>
                      {index < SPECIAL_THANKS.length - 2
                        ? ', '
                        : index === SPECIAL_THANKS.length - 2
                          ? ' and '
                          : ''}
                    </span>
                  ))}{' '}
                  for contributing and sponsoring Embers &apos;26.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom legal bar (beneath the card, with bottom clearance for floating dock) */}
        <div className="mt-5 mb-24 flex flex-col items-center justify-between gap-4 px-4 text-[12px] text-muted-foreground sm:flex-row">
          <p>
            &copy; 2026 P.A. College of Engineering &bull; Dept. of CSE &bull; Embed Club. All
            rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:underline"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
