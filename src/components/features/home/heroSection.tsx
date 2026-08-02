'use client'
import DashboardTitle from '@/app/(frontend)/title'
import { AudioToggleMini, BackgroundAudio } from '@/components/common/backgroundAudio'
// Temporarily unused — the mobile hero marquee is commented out below, pending
// a decision on where it moves to.
// import { LogoMarquee } from '@/components/features/home/logoMarquee'

/**
 * First hero section: brand title + tagline with a looping activities video
 * (muted, autoplay, loop, playsinline). The poster paints instantly for LCP.
 *
 * Desktop: the video is a full-viewport background (object-cover) with the
 * title centered over it.
 * Mobile: title + video card are centered as one vertical stack, with the audio
 * toggle tucked into the video's bottom-right corner.
 */
export function HeroSection() {
  return (
    // `-mt-16 lg:mt-0` cancels ContentPanel's own `pt-16` (the shared shell's
    // mobile clearance for the fixed nav header, applied to every page).
    // Without it the hero doubled up on that clearance — its own title
    // wrapper below also has `pt-16` — leaving ~128px of dead space before
    // anything rendered, which read as a disconnected bar rather than the
    // nav floating (transparent, z-40) over the hero the way it does on
    // desktop. This leaves exactly one 64px clearance, the same amount every
    // other page already relies on for its own title placement.
    // `justify-center` only matters on mobile — on desktop both children are
    // absolutely positioned, so there are no flex items left to distribute.
    // With the marquee gone it keeps the title + video stack visually centred
    // instead of top-anchored above a tall empty gap.
    <section className="relative -mt-16 flex min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-background lg:mt-0">
      {/* Title + tagline — mobile: at the top; desktop: centered overlay */}
      <div className="relative z-10 flex w-full flex-col items-center gap-4 px-4 pt-16 lg:absolute lg:inset-0 lg:justify-center lg:gap-6 lg:pt-0">
        <DashboardTitle />
        <p className="max-w-2xl text-center text-base text-muted-foreground md:text-xl">
          Unlocking the Power of IoT and Embedded Systems
        </p>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById('events')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </button>
        <BackgroundAudio />
      </div>

      {/* Media — mobile: rounded 16:9 card below the title; desktop: absolute cover */}
      <div className="relative mx-4 mt-10 aspect-video overflow-hidden rounded-2xl lg:absolute lg:inset-0 lg:mx-0 lg:mt-0 lg:aspect-auto lg:rounded-none">
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/homePagePoster.jpg"
          src="/homePage.mp4"
          className="h-full w-full object-cover"
        />
        {/* Legibility wash — only where the title sits over the video (desktop) */}
        <div className="absolute inset-0 hidden bg-background/40 lg:block" />

        {/* Compact audio control — inside the video's bottom-right corner on
            mobile. Desktop keeps its copy in the shell header, and this
            container goes full-bleed there, so it's hidden at lg. */}
        <div className="absolute bottom-3 right-3 z-20 lg:hidden">
          <AudioToggleMini />
        </div>
      </div>

      {/* Logo marquee — parked for now, moving somewhere else later. On desktop
          it still renders at the top of the events section.
      <div className="flex flex-1 items-center py-8 lg:hidden">
        <LogoMarquee />
      </div>
      */}
    </section>
  )
}
