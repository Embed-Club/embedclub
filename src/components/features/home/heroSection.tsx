import DashboardTitle from '@/app/(frontend)/title'
import { AudioToggleMini, BackgroundAudio } from '@/components/common/backgroundAudio'

/**
 * First full-viewport section: brand title + tagline over a looping
 * activities video (muted, autoplay, loop, playsinline). The poster paints
 * instantly for LCP while the mp4 loads. The video is decorative
 * (aria-hidden) and sits behind a legibility wash.
 */
export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-background">
      {/* Looping activities video backdrop */}
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/homePagePoster.jpg"
        src="/homePage.mp4"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Subtle legibility wash so the title always reads */}
      <div className="absolute inset-0 bg-background/40" />

      <div className="relative z-10 flex w-full flex-col items-center gap-6 px-4">
        <DashboardTitle />
        <p className="max-w-2xl text-center text-base text-muted-foreground md:text-xl">
          Unlocking the Power of IoT and Embedded Systems
        </p>
        <BackgroundAudio />
      </div>

      {/* Compact audio control, bottom-right on mobile (desktop has it in the shell) */}
      <div className="absolute bottom-4 right-4 z-20 lg:hidden">
        <AudioToggleMini />
      </div>
    </section>
  )
}
