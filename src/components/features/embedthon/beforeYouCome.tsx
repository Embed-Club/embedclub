import { Download } from 'lucide-react'
import { PixelThemeSweep } from './pixelThemeSweep'
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
      {/*
       * This section is where the page turns light. The sweep owns that
       * boundary: it paints the light in as the section rises, then hands the
       * document theme over to it. It is fixed and full-viewport, so it lives
       * here for the trigger only, not for its box.
       */}
      <PixelThemeSweep />

      <div className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-16 2xl:px-24">
        <SectionHeading
          id="before-title"
          title="Guidelines and arrangements"
          deck="The short version is below. The brochure and rulebook carry the full detail."
          titleClassName="max-w-5xl text-[clamp(2.5rem,5.2vw,4.8rem)] leading-[0.92] tracking-[-0.03em]"
          deckClassName="mt-6 max-w-4xl text-lg sm:text-xl lg:text-2xl leading-relaxed text-foreground/70"
          className="mb-14 sm:mb-20"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {TERMS.map((term) => (
            <div
              key={term.label}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-8 sm:p-10 lg:p-12 transition-colors hover:border-primary/40"
            >
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                {term.label}
              </p>
              <p className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
                {term.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:mt-8 lg:gap-8">
          {DOWNLOADS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              download={item.file}
              className="group flex items-start justify-between gap-6 rounded-2xl border border-border/80 bg-card p-8 sm:p-10 lg:p-12 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-primary">
                  {item.label}
                </span>
                <span className="mt-3 block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
                  {item.title}
                </span>
                <span className="mt-3 block text-base sm:text-lg lg:text-xl leading-relaxed text-foreground/70">
                  {item.detail}
                </span>
              </span>
              <Download
                aria-hidden="true"
                className="mt-2 h-7 w-7 shrink-0 text-primary transition-transform duration-200 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
