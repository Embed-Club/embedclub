'use client'

import { useEventCountdown } from '@/hooks/useEventCountdown'
import { Check, Copy, Phone, QrCode, Users } from 'lucide-react'
import { useState } from 'react'
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
      'For Project Expo, squads can have 2 to 4 members. For Paper Presentation, teams can have 1 to 3 authors.',
  },
  {
    question: 'What facilities are provided at Project Expo booths?',
    answer:
      'Each team is allotted exhibition desk space, dedicated AC power sockets for hardware and chargers, and access to campus high-speed Wi-Fi.',
  },
  {
    question: 'What are the cash prizes and certificates?',
    answer:
      'Attractive cash prizes, trophies, and certificates of merit will be awarded to the winner and runner-up squads in both tracks at the valedictory ceremony.',
  },
]

const STEPS = [
  'Form your squad: 2 to 4 members for Project Expo, or 1 to 3 authors for Paper Presentation.',
  'Scan the registration QR code or click the registration link to fill the online portal.',
  'Submit your project synopsis or research abstract before registration closes.',
  'Receive your official entry pass and report to the PACE campus by 08:30 on 25 November 2026.',
]

const PASS_ROWS = [
  ['Event', "Embers '26 - National Level Technical Fest"],
  ['Date', '25 November 2026 (Wednesday)'],
  ['Time', '08:30 - 17:00 IST'],
  ['Venue', 'P.A. College of Engineering (PACE), Mangaluru'],
  ['Tracks', 'Project Expo & Paper Presentation'],
  ['Prizes', 'Exciting Cash Prizes & Merit Certificates'],
  ['Includes', 'Exhibition booth, power, network, lunch & high tea'],
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
          title="Registration and passes"
          deck="One registration per squad. Scan the official QR code or copy the registration link, submit your abstract, and meet us in Mangaluru on 25 November."
        />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <h4 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
              Registration steps
            </h4>

            <ol className="mt-6 border-t border-border">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 border-b border-border py-4 text-[15px] leading-relaxed text-foreground/75"
                >
                  <span className="w-5 shrink-0 font-bold tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {/* Coordinators box directly from poster */}
            <div className="mt-10 rounded-lg border border-border bg-card/60 p-6">
              <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                <Users className="h-4 w-4" />
                Event Coordinators
              </h5>

              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                    Staff Coordinators
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm font-semibold text-foreground/85">
                    {STAFF_COORDINATORS.map((staff) => (
                      <li key={staff}>{staff}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-foreground/50">
                    Dept. of Computer Science & Engineering
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">
                    Student Coordinators
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-foreground/85">
                    {STUDENT_COORDINATORS.map((student) => (
                      <li key={student.name}>
                        <p className="font-semibold">{student.name}</p>
                        <a
                          href={`tel:${student.raw}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary transition-colors hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <p className="text-[13px] text-foreground/50">
                Send it to your squad members and classmates.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-lg border border-border bg-card/70 p-6 shadow-md">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  Official Entry Pass
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                  Embers &apos;26
                </p>
              </div>

              {/* QR Code Scan block matching poster */}
              <div className="my-6 flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-md border-2 border-dashed border-primary bg-background p-2 shadow-inner">
                  <QrCode className="h-20 w-20 text-primary" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Scan for Registration
                </p>
                <p className="mt-1 text-[11px] text-foreground/60">
                  Scan the QR code to open the online registration portal
                </p>
              </div>

              <dl className="space-y-2.5 text-xs">
                {PASS_ROWS.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-1">
                    <dt className="text-foreground/50">{label}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Countdown footer in card */}
              <div className="mt-6 rounded-md border border-border bg-background p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-foreground/50">
                  Time until fest inauguration
                </p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-primary">
                  {pad(left.days)}d : {pad(left.hours)}h : {pad(left.minutes)}m :{' '}
                  {pad(left.seconds)}s
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t border-border pt-16">
          <h4 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
            Frequently answered questions
          </h4>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="rounded-lg border border-border bg-card/30 p-6 transition-colors hover:border-primary/40"
              >
                <h5 className="font-bold text-foreground">{faq.question}</h5>
                <p className="mt-2 text-xs leading-relaxed text-foreground/65">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
