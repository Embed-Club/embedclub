import { SectionHeading } from './sectionHeading'

const TRACKS = [
  {
    title: 'Project Expo',
    detail:
      'Showcase your software projects and working builds. Most entries are software - AI agents, web and mobile apps, data tools, simulations - and hardware is welcome where the idea needs it: boards, sensors, edge AI, robotics, or connected devices. Exhibition stalls provide power drops and display space.',
    badge: 'Software & Working Builds',
    domains: 'Agentic AI, Web & Mobile Apps, Data & Automation, Edge AI, Embedded Systems',
    span: 'lg:col-span-7',
  },
  {
    title: 'Paper Presentation',
    detail:
      'Present original research ideas and technical papers before academic and IEEE evaluators. Present your methodologies, architectural models, benchmark results, and experimental proofs on stage.',
    badge: 'Original Technical Research',
    domains: 'Computer Science, Cyber-Physical Systems, Deep Learning, VLSI & Networks',
    span: 'lg:col-span-5',
  },
  {
    title: 'Exciting Cash Prizes',
    detail:
      'Lucrative cash prizes awarded to the top winning teams and runners-up in each category, complemented by official certificates of achievement and trophies.',
    badge: 'Prize Pool',
    domains: 'Podium Cash Awards, Trophies & Merit Certificates',
    span: 'lg:col-span-5',
  },
  {
    title: 'In Association with IEEE & GLUG PACE',
    detail:
      'Supported by premier technical societies: GLUG PACE, IEEE Mangalore Subsection, IEEE Bangalore Section, and IEEE Council on Electronic Design Automation (CEDA) Mangalore Chapter.',
    badge: 'Partner Societies',
    domains: 'GLUG PACE, IEEE Mangalore, IEEE Bangalore, IEEE CEDA',
    span: 'lg:col-span-7',
  },
]

export function SyllabusLedger() {
  return (
    <section id="tracks" aria-labelledby="tracks-title" className="relative scroll-mt-16">
      <div className="w-full px-5 py-20 sm:py-28">
        <SectionHeading
          id="tracks-title"
          title="Two flagship tracks, one national stage"
          deck="Choose your arena. Present working software builds in Project Expo, or defend original research and experimental results in Paper Presentation."
        />

        {/* Bento: the two flagships take unequal widths, the short facts fill the
            second row, so the grid reads as a composition rather than four equal
            tiles. No hover ink - the cards are static. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {TRACKS.map((track) => (
            <div
              key={track.title}
              className={`relative flex flex-col justify-between rounded-lg border border-border bg-card/60 p-8 ${track.span}`}
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
