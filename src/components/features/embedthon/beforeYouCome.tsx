import { SectionHeading } from './sectionHeading'

const TERMS = [
  {
    label: 'Eligibility',
    value: 'Engineering Students (UG/PG)',
    note: 'Open to engineering students from all recognized institutions nationwide.',
  },
  {
    label: 'Squad Size',
    value: '2 to 4 members (Expo) / 1 to 3 (Paper)',
    note: 'Project Expo teams can have 2 to 4 members. Paper Presentation allows 1 to 3 authors.',
  },
  {
    label: 'Prizes',
    value: 'Exciting Cash Prizes',
    note: 'Podium cash awards, winner trophies, and certificates of merit for top teams.',
  },
  {
    label: 'Venue',
    value: 'PACE Campus, Mangaluru',
    note: 'Seminar halls, conference auditoriums, and dedicated exhibition bays.',
  },
]

const FACILITIES = [
  {
    title: 'Exhibition Power',
    detail: 'Dedicated AC power sockets and extension lines at every Project Expo booth.',
  },
  {
    title: 'Campus Network',
    detail: 'High-speed campus Wi-Fi connectivity across all fest venues and demonstration halls.',
  },
  {
    title: 'Meals & High Tea',
    detail: 'Complimentary morning refreshments, full lunch, and evening high tea for all teams.',
  },
  {
    title: 'Evaluation Stages',
    detail:
      'Audio-visual equipped seminar halls with HD projectors for slide presentations and defense.',
  },
]

const BRING = [
  'Working prototype hardware, development boards, and sensors',
  'Laptops, chargers, and any specialized programming tools',
  'Power strips / adapters if your build requires multiple plugs',
  'Presentation slides loaded on a backup USB drive',
  'Valid college identification card for every squad member',
]

export function BeforeYouCome() {
  return (
    <section id="venue" aria-labelledby="before-title" className="relative scroll-mt-16">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <SectionHeading
          id="before-title"
          title="Guidelines and arrangements"
          deck="Everything arranged on campus so you can focus on presenting your finest engineering build. Here is what is covered and what to bring."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((term) => (
            <div
              key={term.label}
              className="rounded-lg border border-border bg-card/60 p-6 shadow-sm transition-colors hover:border-primary/50"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {term.label}
              </p>
              <p className="mt-2 text-xl font-extrabold text-foreground">{term.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/60">{term.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h4 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
              Facilities on site
            </h4>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {FACILITIES.map((facility) => (
                <div
                  key={facility.title}
                  className="rounded-lg border border-border bg-card/40 p-5"
                >
                  <p className="text-base font-bold text-foreground">{facility.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/60">
                    {facility.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <h4 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
              What to bring
            </h4>
            <ul className="mt-6 space-y-3">
              {BRING.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/80 p-3.5 text-xs leading-relaxed text-foreground/75"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
