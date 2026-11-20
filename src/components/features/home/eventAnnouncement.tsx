'use client'

import { SpecialThanksDropdown } from '@/components/common/specialThanks'
import { IntroContext } from '@/components/layout/frontendShell'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'

/**
 * The announcement shown on the home page. Hardcoded for now: the plan is to move
 * it into Payload (a global with a title, a message, a button label and a target
 * page) so a committee member can change it without a developer.
 */
const ANNOUNCEMENT = {
  title: "Embers '26 is here",
  message:
    'A national level technical fest by the Department of CSE with Embed Club: an AI workshop, Embedthon, Project Expo, Paper Presentation and cash prizes.',
  date: '24 and 25 November 2026, PACE Campus, Mangaluru',
  buttonLabel: "Go to Embers '26",
  href: '/embers',
  image: '/embersLogoBackdrop.webp',
} as const

/** Seen this session: do not nag on every visit to the home page. */
const SEEN_KEY = 'embed-announcement-seen'
/** Let the home intro land before anything covers it. */
const SHOW_DELAY_MS = 900

export function EventAnnouncement() {
  const { isIntroFinished } = useContext(IntroContext)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isIntroFinished) return

    let seen = false
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      // Storage blocked: show it, it just may show again next visit.
    }
    if (seen) return

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isIntroFinished])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) return
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Same as above.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-2xl border-border/80 bg-card p-0 text-card-foreground">
        {/* The mark is dark-on-dark artwork, so its well is the dark palette. */}
        <div className="dark relative h-44 w-full shrink-0 overflow-hidden bg-background">
          <Image
            src={ANNOUNCEMENT.image}
            alt=""
            fill
            sizes="28rem"
            className="object-contain p-4 [filter:drop-shadow(0_0_1px_hsl(var(--primary)/0.9))_drop-shadow(0_0_10px_hsl(var(--primary)/0.3))]"
          />
        </div>

        <div className="flex flex-col gap-3 p-5">
          <DialogTitle className="text-2xl font-extrabold leading-tight tracking-tight">
            {ANNOUNCEMENT.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {ANNOUNCEMENT.message}
          </DialogDescription>
          <p className="text-sm font-semibold text-primary">{ANNOUNCEMENT.date}</p>

          <Link
            href={ANNOUNCEMENT.href}
            onClick={() => handleOpenChange(false)}
            className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {ANNOUNCEMENT.buttonLabel}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>

          <div className="mt-2 border-t border-border pt-2">
            <SpecialThanksDropdown />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
