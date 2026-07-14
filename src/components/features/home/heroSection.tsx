import DashboardTitle from '@/app/(frontend)/title'
import { AudioToggleMini, BackgroundAudio } from '@/components/common/backgroundAudio'
import Image from 'next/image'

// Static hero background. Placeholder for now — later swap for a muted, looping
// video of club activities (keep this element the full-bleed background layer).
const HERO_IMAGE = '/iot.jpeg'

/** First full-viewport section: full-bleed image, brand title, tagline. */
export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">
      {/* Background image (video placeholder) */}
      <Image
        src={HERO_IMAGE}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Legibility overlay so the title reads on any image */}
      <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />

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
