'use client'

import { useEventCountdown } from '@/hooks/useEventCountdown'
import { Check, Copy, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { eventDetails } from './eventType'
import { SectionHeading } from './sectionHeading'

const FAQS = [
  {
    question: 'Who is eligible to participate in Embers ’26?',
    answer:
      'Embers ’26 is open to undergraduate and postgraduate students from all recognized engineering institutions across India. Teams can register for Project Expo, Paper Presentation, or both.',
  },
  {
    question: 'What are the squad size requirements?',
    answer:
      'Every squad has a minimum of 2 and a maximum of 4 members, for both Project Expo and Paper Presentation.',
  },
  {
    question: 'What facilities are provided at Project Expo booths?',
    answer:
      'Each team is allotted exhibition desk space, dedicated AC power sockets for laptops and any hardware, and access to campus high-speed Wi-Fi.',
  },
  {
    question: 'What are the cash prizes and certificates?',
    answer:
      'Attractive cash prizes, trophies, and certificates of merit will be awarded to the winner and runner-up squads in both tracks at the valedictory ceremony.',
  },
]

const STEPS = [
  {
    title: 'Form your squad',
    detail: 'A squad has 2 to 4 members, for both Project Expo and Paper Presentation.',
  },
  {
    title: 'Fill in the registration form',
    detail:
      'One registration per squad. Questions about it? A student coordinator is listed below.',
  },
  {
    title: 'Submit your work',
    detail: 'Send your project synopsis or research abstract before registration closes.',
  },
  {
    title: 'Get your entry confirmation',
    detail: 'Report to the PACE campus by 08:30 on 25 November 2026 with your squad.',
  },
]

const FACTS = [
  ['Date', '25 November 2026, Wednesday'],
  ['Time', '08:30 to 17:00 IST'],
  ['Venue', 'P.A. College of Engineering (PACE), Mangaluru'],
  ['Tracks', 'Project Expo and Paper Presentation'],
  ['Prizes', 'Cash prizes and merit certificates'],
  ['Includes', 'Exhibition booth, power, network, lunch and high tea'],
]

const STAFF_COORDINATORS = [
  'Prof. Habeeb Ur Rahman',
  'Dr. Mohammed Hafeez M.K.',
  'Prof. Mohammed Saifuddin',
]

const STUDENT_COORDINATORS = [
  { name: 'Rafan Ahamad Sheik', phone: '+91 90361 92359', raw: '+919036192359' },
  { name: 'Fizan Feroz', phone: '+91 94464 51783', raw: '+919446451783' },
]

const COUNTDOWN_UNITS = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Min'],
  ['seconds', 'Sec'],
] as const

/**
 * The questions, on a screen of their own: edge to edge and exactly one viewport
 * tall, outside the page's content column, with the heading centred above the list
 * and the whole block centred in the screen. Whichever answer is open therefore sits
 * in the middle of the screen rather than hanging off the bottom of the page. One
 * answer is open at a time; opening another closes the first, and the answer grows
 * from nothing rather than snapping into place.
 */
function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="flex min-h-svh w-full flex-col justify-center border-t border-border py-12 sm:py-16">
      <h3 className="px-5 text-center text-[clamp(2.2rem,6vw,6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-foreground sm:px-10">
        Frequently asked questions
      </h3>

      <div className="mt-[clamp(1.5rem,6svh,4rem)] w-full px-5 sm:px-10">
        {FAQS.map((faq, index) => {
          const isOpen = open === index

          return (
            <div key={faq.question} className="border-b border-border first:border-t">
              <h4>
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="group flex w-full items-center justify-between gap-6 py-[clamp(1rem,3svh,2rem)] text-left text-[clamp(1.2rem,2.6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.02em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {faq.question}
                  <Plus
                    aria-hidden="true"
                    className={`h-7 w-7 shrink-0 text-primary transition-transform duration-300 sm:h-9 sm:w-9 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
              </h4>
              <section
                id={`faq-answer-${index}`}
                aria-labelledby={`faq-question-${index}`}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[70ch] pb-[clamp(1rem,3svh,2rem)] text-[clamp(1rem,1.5vw,1.4rem)] leading-relaxed text-foreground/70">
                    {faq.answer}
                  </p>
                </div>
              </section>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RegistrationSheet() {
  const [copied, setCopied] = useState(false)
  const left = useEventCountdown()

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access declined
    }
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    <section id="register" aria-labelledby="register-title" className="relative scroll-mt-16">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <SectionHeading
          id="register-title"
          title="Register your squad"
          deck="One registration per squad. Submit your abstract before registration closes, then meet us in Mangaluru on 25 November."
          titleClassName="max-w-none text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.92] tracking-[-0.03em]"
          deckClassName="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 sm:text-xl"
        />

        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
              How to register
            </h3>

            <ol className="mt-8 border-t border-border">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[3.5rem_1fr] items-baseline gap-4 border-b border-border py-6 sm:grid-cols-[4.5rem_1fr]"
                >
                  <span className="text-4xl font-extrabold leading-none tabular-nums text-primary sm:text-5xl">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-lg font-bold text-foreground sm:text-xl">{step.title}</p>
                    <p className="mt-1 text-base leading-relaxed text-foreground/70">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="mt-14 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
              Questions? Talk to us
            </h3>

            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-foreground/60">Student coordinators</p>
                <ul className="mt-4 space-y-4">
                  {STUDENT_COORDINATORS.map((student) => (
                    <li key={student.name} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="min-w-[10rem] text-base font-semibold text-foreground">
                        {student.name}
                      </span>
                      <a
                        href={`tel:${student.raw}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold tabular-nums text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
                        {student.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-bold text-foreground/60">Staff coordinators</p>
                <ul className="mt-4 space-y-2 text-base font-semibold text-foreground">
                  {STAFF_COORDINATORS.map((staff) => (
                    <li key={staff}>{staff}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-foreground/60">
                  Department of Computer Science and Engineering
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8 lg:sticky lg:top-24">
              <p className="text-sm font-semibold text-foreground/60">Embers ’26 begins in</p>

              <div
                className="mt-3 grid grid-cols-4 gap-2 sm:gap-3"
                role="timer"
                aria-label="Time until Embers 26 begins"
              >
                {COUNTDOWN_UNITS.map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-background px-1 py-3 text-center sm:py-4"
                  >
                    <p className="text-3xl font-extrabold leading-none tabular-nums text-primary sm:text-4xl">
                      {pad(left[key])}
                    </p>
                    <p className="mt-2 text-xs font-medium text-foreground/60">{label}</p>
                  </div>
                ))}
              </div>

              <dl className="mt-8 divide-y divide-border border-y border-border">
                {FACTS.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 py-3 text-[15px]"
                  >
                    <dt className="text-foreground/60">{label}</dt>
                    <dd className="font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={eventDetails.embers.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Register your squad
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-border px-5 text-[15px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {copied ? (
                    <>
                      <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                      Link copied
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="h-4 w-4 text-primary" />
                      Copy fest page link
                    </>
                  )}
                </button>
                <p className="text-sm text-foreground/60">
                  Send it to your squad members and classmates.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <FaqAccordion />
    </section>
  )
}
