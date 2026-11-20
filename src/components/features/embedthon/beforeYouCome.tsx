import { ExternalLink } from 'lucide-react'
import { eventDetails } from './eventType'
import { SectionHeading } from './sectionHeading'

const TERMS = [
  { label: 'Eligibility', value: 'Engineering students (UG/PG)' },
  { label: 'Squad size', value: '2 to 4 members (Expo and Paper)' },
  { label: 'Prizes', value: 'Cash prizes and trophies' },
  { label: 'Venue', value: 'PACE Campus, Mangaluru' },
]

export function BeforeYouCome() {
  return (
    <section id="venue" aria-labelledby="before-title" className="relative scroll-mt-16">
      <div className="w-full px-6 py-20 sm:px-10 sm:py-28 lg:px-16 2xl:px-24">
        <SectionHeading
          id="before-title"
          title="Guidelines and arrangements"
          deck="The short version is below. The rulebook carries the full detail."
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

        {/* The rulebook is the event brochure too: one document, hosted on Google
            Drive, so it opens in a new tab rather than downloading. */}
        <a
          href={eventDetails.embers.rulebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 flex items-start justify-between gap-6 rounded-2xl border border-border/80 bg-card p-8 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-10 lg:mt-8 lg:p-12"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Rulebook
            </span>
            <span className="mt-3 block text-2xl font-extrabold leading-tight text-foreground sm:text-3xl lg:text-4xl">
              Rules, guidelines and event overview
            </span>
            <span className="mt-3 block max-w-3xl text-base leading-relaxed text-foreground/70 sm:text-lg lg:text-xl">
              Team limits, submission rules, judging criteria, both tracks, and the day plan.
            </span>
          </span>
          <ExternalLink
            aria-hidden="true"
            className="mt-2 h-7 w-7 shrink-0 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </a>
      </div>
    </section>
  )
}
