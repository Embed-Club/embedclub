'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight, Check, Copy, Mail, Phone, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Card shell shared by the email and phone entries - enlarged from the old
 * inline link row so the redirect affordance (the corner arrow) has room to
 * read as a button, not just text with an icon in front of it.
 */
function ContactCard({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors sm:w-auto',
        'hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active && 'border-primary',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:border-primary">
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="ml-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return ref
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return true
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function EmailCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))

  const options = [
    { label: 'Gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}` },
    { label: 'Outlook', href: `https://outlook.live.com/mail/0/deeplink/compose?to=${email}` },
    { label: 'Default mail app', href: `mailto:${email}` },
  ]

  return (
    <div ref={ref} className="relative">
      <ContactCard
        icon={<Mail className="h-4 w-4" />}
        label={email}
        active={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target={opt.label === 'Default mail app' ? undefined : '_blank'}
              rel={opt.label === 'Default mail app' ? undefined : 'noopener noreferrer'}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {opt.label}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function PhoneCard({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))

  function handleClick() {
    if (isMobileDevice()) {
      window.location.href = `tel:${phone}`
      return
    }
    setOpen((v) => !v)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div ref={ref} className="relative">
      <ContactCard
        icon={<Phone className="h-4 w-4" />}
        label={phone}
        active={open}
        onClick={handleClick}
      />
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-lg">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Smartphone className="h-4 w-4 text-primary" />
            Open on your phone to call
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This browser can&apos;t open a dialer. Copy the number or continue anyway.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy number'}
            </button>
            <a
              href={`tel:${phone}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Call anyway
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

/** The enlarged email/phone row on /contact - each entry is its own card. */
export function ContactLinks({ email, phone }: { email?: string | null; phone?: string | null }) {
  if (!email && !phone) return null

  return (
    <div className="mt-10 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
      {email && <EmailCard email={email} />}
      {phone && <PhoneCard phone={phone} />}
    </div>
  )
}
