import { SectionHeading } from './sectionHeading'

const TRACKS = [
  {
    title: 'Project Expo',
    detail:
      'Showcase your innovative projects and working prototypes. Bring physical boards, microcontrollers, sensors, edge AI hardware, robotics, or IoT connected devices. Exhibition stalls provide power drops and display space.',
    badge: 'Hardware & Working Builds',
    domains: 'Embedded Systems, IoT, Edge AI, Robotics, Smart Infrastructure',
  },
  {
    title: 'Paper Presentation',
    detail:
      'Present original research ideas and technical papers before academic and IEEE evaluators. Present your methodologies, architectural models, benchmark results, and experimental proofs on stage.',
    badge: 'Original Technical Research',
    domains: 'Computer Science, Cyber-Physical Systems, Deep Learning, VLSI & Networks',
  },
  {
    title: 'Exciting Cash Prizes',
    detail:
      'Lucrative cash prizes awarded to the top winning teams and runners-up in each category, complemented by official certificates of achievement and trophies.',
    badge: 'Prize Pool',
    domains: 'Podium Cash Awards, Trophies & Merit Certificates',
  },
  {
    title: 'In Association with IEEE & GLUG PACE',
    detail:
      'Supported by premier technical societies: GLUG PACE, IEEE Mangalore Subsection, IEEE Bangalore Section, and IEEE Council on Electronic Design Automation (CEDA) Mangalore Chapter.',
    badge: 'Partner Societies',
    domains: 'GLUG PACE, IEEE Mangalore, IEEE Bangalore, IEEE CEDA',
  },
]

export function SyllabusLedger() {
  return (
    <section id="tracks" aria-labelledby="tracks-title" className="relative scroll-mt-16">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <SectionHeading
          id="tracks-title"
          title="Two flagship tracks, one national stage"
          deck="Choose your arena. Showcase working hardware prototypes and embedded systems in Project Expo, or defend original research and experimental results in Paper Presentation."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {TRACKS.map((track) => (
            <div
              key={track.title}
              className="relative flex flex-col justify-between rounded-lg border border-border bg-card/60 p-8 shadow-sm transition-all duration-300 hover:border-primary/60 hover:shadow-md"
            >
              <div>
                <span className="inline-block rounded-sm bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  {track.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
                  {track.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
                  {track.detail}
                </p>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <p className="text-[11px] uppercase tracking-wider text-foreground/45">Domains</p>
                <p className="mt-1 text-xs font-semibold text-primary">{track.domains}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
