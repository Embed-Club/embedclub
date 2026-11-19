'use client'

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

const PARTNER_BADGES = [
  'GLUG PACE',
  'IEEE MANGALORE SUBSECTION',
  'IEEE BANGALORE',
  'IEEE CEDA',
  'P.A. COLLEGE OF ENGINEERING',
  'VTU BELAGAVI',
  'AICTE',
]

export function EmbedthonFooter({ event }: { event: EventType }) {
  return (
    <footer className="relative z-10 w-full overflow-hidden bg-background pt-16 pb-8 sm:pt-24 sm:pb-12 text-foreground">
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

          {/* Top signature emblem nestled inside the elevated top tab. The mark
              is a light-background illustration, so the tab itself is the
              light plate it sits on. */}
          <div className="absolute top-2 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center sm:top-3.5">
            <div className="light flex h-9 w-28 items-center justify-center rounded-b-xl bg-background px-3 shadow-inner sm:h-11 sm:w-36">
              <Image
                src="/embersLogoMark.webp"
                alt="Embed Club"
                width={768}
                height={796}
                className="size-7 object-contain sm:size-9"
              />
            </div>
          </div>

          {/* Content container with proper responsive clearance */}
          <div className="relative z-10 flex flex-col items-center px-4 pt-24 pb-24 sm:px-8 sm:pt-28 sm:pb-28 md:pt-32 md:pb-32 lg:px-14">
            {/* Main title: ALWAYS BRINGING THE EMBER */}
            <h2 className="text-center text-[clamp(2.2rem,5vw,5rem)] font-black uppercase leading-[0.92] tracking-[-0.03em] text-foreground">
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
            <div className="mt-8 hidden w-full grid-cols-12 items-center gap-6 md:grid lg:mt-10">
              {/* Left Column: Pages */}
              <div className="col-span-3 flex flex-col items-start text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                  Pages
                </p>
                <nav
                  aria-label="Footer pages"
                  className="mt-4 flex flex-col space-y-2 sm:space-y-2.5"
                >
                  {PAGE_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className={`text-lg font-bold uppercase tracking-tight transition-all duration-200 sm:text-xl ${
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
                <div className="relative -mt-2 sm:-mt-6 w-full max-w-[320px] sm:max-w-[380px] aspect-square flex items-center justify-center">
                  <Image
                    src="/embersCenterpiece.webp"
                    alt="Embers '26 Core Unit"
                    width={380}
                    height={380}
                    priority
                    className="pointer-events-none h-auto w-full select-none object-contain drop-shadow-2xl"
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
                  className="mt-4 flex flex-col space-y-2 sm:space-y-2.5"
                >
                  {PARTNER_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-lg font-bold uppercase tracking-tight text-muted-foreground transition-all duration-200 hover:text-primary sm:text-xl"
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
              <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center">
                <Image
                  src="/embersCenterpiece.webp"
                  alt="Embers '26 Core Unit"
                  width={260}
                  height={260}
                  priority
                  className="pointer-events-none h-auto w-full select-none object-contain drop-shadow-2xl"
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

            {/* Bottom partner logos strip inside the card */}
            <div className="mt-10 w-full border-t border-border pt-5 sm:mt-12 sm:pt-6">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
                {PARTNER_BADGES.map((badge, idx) => (
                  <span key={badge} className="flex items-center gap-6">
                    <span className="transition-colors hover:text-primary">{badge}</span>
                    {idx < PARTNER_BADGES.length - 1 && (
                      <span className="h-1 w-1 rounded-full bg-primary/50" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom legal bar (beneath the card, with bottom clearance for floating dock) */}
        <div className="mt-8 mb-20 sm:mb-24 flex flex-col items-center justify-between gap-4 px-4 text-[12px] text-muted-foreground sm:flex-row">
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
