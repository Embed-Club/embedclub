'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight, Check, Copy, Mail, Phone, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * `compact` is the same card at event-modal scale: the modal column is narrow
 * and the contact block sits among several other panels, so it cannot take the
 * room the /contact page gives it.
 */
type Size = 'default' | 'compact'

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
  size,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
  size: Size
}) {
  const compact = size === 'compact'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center rounded-xl border border-border bg-card text-left transition-colors',
        compact ? 'gap-2.5 px-3 py-2.5' : 'gap-3 px-5 py-4 sm:w-auto',
        'hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active && 'border-primary',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:border-primary',
          compact ? 'h-7 w-7' : 'h-9 w-9',
        )}
      >
        {icon}
      </span>
      {/* Compact truncates rather than wrapping: an address long enough to wrap
          would push the arrow onto a second line inside the modal. */}
      <span
        className={cn(
          'font-medium text-foreground',
          compact ? 'flex-1 truncate text-xs' : 'text-sm',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground',
          compact ? 'ml-auto h-5 w-5' : 'ml-6 h-6 w-6',
        )}
      >
        <ArrowUpRight className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
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

function EmailCard({ email, size }: { email: string; size: Size }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  const compact = size === 'compact'

  const options = [
    { label: 'Gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}` },
    { label: 'Outlook', href: `https://outlook.live.com/mail/0/deeplink/compose?to=${email}` },
    { label: 'Default mail app', href: `mailto:${email}` },
  ]

  return (
    <div ref={ref} className="relative">
      <ContactCard
        icon={<Mail className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
        label={email}
        active={open}
        size={size}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div
          className={cn(
            'absolute top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg',
            // Compact anchors to the left edge and spans the card: centring a
            // popover inside the modal column pushes it past the edge.
            compact ? 'left-0 w-full' : 'left-1/2 w-56 -translate-x-1/2',
          )}
        >
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target={opt.label === 'Default mail app' ? undefined : '_blank'}
              rel={opt.label === 'Default mail app' ? undefined : 'noopener noreferrer'}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center justify-between text-foreground transition-colors hover:bg-muted hover:text-primary',
                compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm',
              )}
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

function PhoneCard({ phone, size }: { phone: string; size: Size }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  const compact = size === 'compact'

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
        icon={<Phone className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
        label={phone}
        active={open}
        size={size}
        onClick={handleClick}
      />
      {open && (
        <div
          className={cn(
            'absolute top-full z-20 mt-2 rounded-xl border border-border bg-card p-4 shadow-lg',
            compact ? 'left-0 w-full p-3' : 'left-1/2 w-64 -translate-x-1/2',
          )}
        >
          <p
            className={cn(
              'flex items-center gap-2 font-medium text-foreground',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
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
export function ContactLinks({
  email,
  phone,
  size = 'default',
  className,
}: {
  email?: string | null
  phone?: string | null
  size?: Size
  className?: string
}) {
  if (!email && !phone) return null

  return (
    <div
      className={cn(
        'flex flex-col flex-wrap gap-3',
        size === 'compact' ? 'gap-2' : 'mt-10 items-center justify-center sm:flex-row',
        className,
      )}
    >
      {email && <EmailCard email={email} size={size} />}
      {phone && <PhoneCard phone={phone} size={size} />}
    </div>
  )
}
