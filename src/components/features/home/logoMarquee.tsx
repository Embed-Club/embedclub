import { Marquee } from '@/components/common/marquee'

/** Embed Club wordmark — swaps by theme via CSS (no JS). */
function EmbedLogo() {
  return (
    <div className="flex h-12 items-center md:h-16">
      <img
        src="/embedClubLogo-Light.svg"
        alt="Embed Club"
        className="block h-full w-auto dark:hidden"
      />
      <img
        src="/embedClubLogo-Dark.svg"
        alt="Embed Club"
        className="hidden h-full w-auto dark:block"
      />
    </div>
  )
}

/** PA College of Engineering crest. */
function PaLogo() {
  return (
    <div className="flex h-12 items-center md:h-16">
      <img src="/pace-logo.png" alt="PA College of Engineering" className="h-full w-auto" />
    </div>
  )
}

/**
 * Infinite marquee of the Embed Club and PA College logos, alternating.
 * Shared between the mobile hero and the desktop events section, so the
 * `className` prop carries the per-placement responsive visibility.
 */
export function LogoMarquee({ className }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${className ?? ''}`}>
      <Marquee pauseOnHover className="[--duration:15s] [--gap:5rem]">
        <EmbedLogo />
        <PaLogo />
        <EmbedLogo />
        <PaLogo />
      </Marquee>
      {/* Edge fades into the section background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
    </div>
  )
}
