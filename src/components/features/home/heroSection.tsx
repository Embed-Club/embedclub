import DashboardTitle from '@/app/(frontend)/title'
import { AudioToggleMini, BackgroundAudio } from '@/components/common/backgroundAudio'

/**
 * First full-viewport section: brand title + tagline over a themed backdrop.
 *
 * The backdrop is a CSS gradient for now (no image dependency). To use a
 * looping activities video later, drop a <video> (muted, autoplay, loop,
 * playsinline) as the first absolute-inset child in place of the gradient div.
 */
export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">
      {/* Themed gradient backdrop (video placeholder) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--muted))_0%,_hsl(var(--background))_100%)]"
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
