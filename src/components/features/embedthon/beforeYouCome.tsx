import { Download } from 'lucide-react'
import { SectionHeading } from './sectionHeading'

const TERMS = [
  { label: 'Eligibility', value: 'Engineering students (UG/PG)' },
  { label: 'Squad size', value: '2 to 4 (Expo) / 1 to 3 (Paper)' },
  { label: 'Prizes', value: 'Cash prizes and trophies' },
  { label: 'Venue', value: 'PACE Campus, Mangaluru' },
]

/**
 * The paperwork lives in the PDFs. Drop the real files into public/downloads
 * and the two links below serve them; until then they point at those names.
 */
const DOWNLOADS = [
  {
    label: 'Brochure',
    title: 'Embers brochure',
    detail: 'Event overview, both tracks, and the day plan.',
    href: '/downloads/embers26-brochure.pdf',
    file: 'embers26-brochure.pdf',
  },
  {
    label: 'Rulebook',
    title: 'Rules and guidelines',
    detail: 'Team limits, submission rules, and judging criteria.',
    href: '/downloads/embers26-rulebook.pdf',
    file: 'embers26-rulebook.pdf',
  },
]

export function BeforeYouCome() {
  return (
    <section id="venue" aria-labelledby="before-title" className="relative scroll-mt-16">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <SectionHeading
          id="before-title"
          title="Guidelines and arrangements"
          deck="The short version is below. The brochure and rulebook carry the full detail."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((term) => (
            <div key={term.label} className="rounded-lg border border-border bg-card/60 p-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {term.label}
              </p>
              <p className="mt-2 text-xl font-extrabold text-foreground">{term.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {DOWNLOADS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              download={item.file}
              className="group flex items-start justify-between gap-6 rounded-lg border border-border bg-card/60 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                  {item.label}
                </span>
                <span className="mt-2 block text-xl font-extrabold text-foreground">
                  {item.title}
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-foreground/60">
                  {item.detail}
                </span>
              </span>
              <Download
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0 text-primary"
                strokeWidth={2}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
