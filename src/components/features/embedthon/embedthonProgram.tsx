import { SectionHeading } from './sectionHeading'

const WORKSHOP_FOCUS = [
  'Agentic IDE and environment',
  'Prompt engineering',
  'Master prompting and project planning',
  'Project development',
  'Auditing and code review',
  'Debugging and refinement',
  'Advanced agent workflows',
]

export function EmbedthonProgram() {
  return (
    <>
      <section id="roadmap" aria-labelledby="program-title" className="relative scroll-mt-16">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
          <SectionHeading
            id="program-title"
            title="Learn, then build"
            deck="Embedthon begins with a practical workshop and continues as a 24-hour team hackathon."
          />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <article className="rounded-lg border border-border bg-card/60 p-8">
              <p className="text-sm font-semibold text-primary">Day 1</p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                Workshop
              </h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/70">
                Agentic AI: End-to-End Software Development
              </p>
              <p className="mt-6 text-sm font-semibold text-foreground">09:00 to 15:00</p>
            </article>

            <article className="rounded-lg border border-border bg-card/60 p-8">
              <p className="text-sm font-semibold text-primary">Day 1 to Day 2</p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                24-hour hackathon
              </h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/70">
                Build a real software solution with a team of four.
              </p>
              <p className="mt-6 text-sm font-semibold text-foreground">
                15:00 on 24 November to 15:00 on 25 November
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="tracks" aria-labelledby="focus-title" className="relative scroll-mt-16">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
          <SectionHeading
            id="focus-title"
            title="Workshop focus"
            deck="The workshop gives your team the working process to plan, build, review, and refine with AI coding agents."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {WORKSHOP_FOCUS.map((topic) => (
              <li
                key={topic}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-5 text-sm font-semibold text-foreground"
              >
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="register" aria-labelledby="register-title" className="relative scroll-mt-16">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
          <SectionHeading
            id="register-title"
            title="Registration"
            deck="Open to second-year CSE students. Meet your team at the Seminar Hall and come ready to build."
          />
          <a
            href="https://forms.gle/B6RdZZhG5mFa34sJA"
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Register for Embedthon
          </a>
        </div>
      </section>
    </>
  )
}
