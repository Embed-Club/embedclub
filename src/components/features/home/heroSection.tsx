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
    <section className="relative -mt-16 flex min-h-[100svh] w-full flex-col justify-start overflow-hidden bg-background lg:mt-0">
      {/* Hardware cutouts — mobile only. The stack above is top-anchored
          (`justify-start`) precisely so this band at the bottom stays free:
          both hands rise into it from below the fold. Both are decorative
          (empty alt + aria-hidden) and sit at z-0, under the z-10 title block.
          The negative translate pushes each wrist past the section edge so the
          arm reads as entering the frame rather than floating; the section's
          own `overflow-hidden` does the cropping.
          Sources are trimmed-to-alpha WebP derivatives of the PNGs in /public —
          `sizes` is what keeps next/image from shipping the full-width file to
          a phone. */}
      {/* The still is now a keyed clip of the module being turned over. WebM
          carries real alpha; Safari has no VP9-alpha support, so it falls back
          to the MP4 with the light background already baked in.
          The odd -29% translate is not a typo: the board sits at 29% of the
          clip's width (measured over all 240 frames), with the hand filling
          the rest, so centring the *element* would leave the module itself
          off to the left. This lands the board on the screen's centre line. */}
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/oledEmbed.webp"
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-[72%] max-w-[320px] -translate-x-[29%] select-none lg:hidden"
      >
        <source src="/oledRotateCrop.webm" type="video/webm" />
        <source src="/oledRotateCropLight.mp4" type="video/mp4" />
      </video>

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
