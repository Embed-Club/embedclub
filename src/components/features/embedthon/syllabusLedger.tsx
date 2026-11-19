import { SectionHeading } from './sectionHeading'

const TRACKS = [
  {
    title: 'Project Expo',
    detail:
      'Showcase working builds and end-to-end software systems. Most entries are software - AI agents, full-stack web and mobile apps, data tools, simulations - with hardware welcome where the idea needs it: microcontrollers, sensors, edge AI, robotics, or connected devices. Stalls include power drops and exhibition table space.',
  },
  {
    title: 'Paper Presentation',
    detail:
      'Present original research ideas and technical papers before academic and IEEE evaluators. Present your methodologies, architectural models, benchmark results, and experimental proofs on stage with slide deck defense.',
  },
]

export function SyllabusLedger() {
  return (
    <section
      id="tracks"
      aria-labelledby="tracks-title"
      className="relative z-20 scroll-mt-16 bg-background text-foreground"
    >
      <div className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-16 2xl:px-24">
        <SectionHeading
          id="tracks-title"
          title="Two flagship tracks, one national stage"
          deck="Choose your arena. Present working software builds in Project Expo, or defend original research and experimental results in Paper Presentation."
          titleClassName="max-w-5xl text-[clamp(2.5rem,5.2vw,4.8rem)] leading-[0.92] tracking-[-0.03em]"
          deckClassName="mt-6 max-w-4xl text-lg sm:text-xl lg:text-2xl leading-relaxed text-foreground/70"
          className="mb-14 sm:mb-20"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {TRACKS.map((track) => (
            <div
              key={track.title}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-10 sm:p-12 lg:p-16 transition-colors hover:border-primary/40"
            >
              <div>
                <h3 className="text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {track.title}
                </h3>
                <p className="mt-6 text-lg leading-relaxed text-foreground/80 sm:text-xl lg:text-2xl">
                  {track.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
