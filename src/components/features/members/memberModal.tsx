'use client'

import { CutoutCorner } from '@/components/common/cutoutCard'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { Github, Globe, Instagram, Linkedin, Twitter, X, Youtube } from 'lucide-react'
import { motion } from 'motion/react'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface MemberModalData {
  id: string
  fullName: string
  image: string
  /** Most recent role first — the rest read as roles previously held. */
  roles: string[]
  years?: string
  bio?: string
  github?: string
  linkedin?: string
  socials: { platform: string; url: string }[]
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  other: Globe,
}

const PLATFORM_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  other: 'Website',
}

/**
 * Every platform the club records, shown whether or not this member has one.
 * The ask was to say what is available *and* what is not, so an absent account
 * is a muted row rather than a gap the reader has to infer.
 */
const TRACKED_PLATFORMS = ['github', 'linkedin', 'instagram', 'twitter'] as const

function SocialRow({ platform, url }: { platform: string; url?: string }) {
  const Icon = PLATFORM_ICONS[platform] ?? Globe
  const label = PLATFORM_LABELS[platform] ?? platform

  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground/60">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="ml-auto text-xs">Not available</span>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">View</span>
    </a>
  )
}

export function MemberModal({ member, onClose }: { member: MemberModalData; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useOutsideClick(containerRef, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (typeof document === 'undefined') return null

  const [currentRole, ...previousRoles] = member.roles
  const byPlatform = new Map(member.socials.map((s) => [s.platform, s.url]))
  if (member.github) byPlatform.set('github', member.github)
  if (member.linkedin) byPlatform.set('linkedin', member.linkedin)

  // Anything recorded beyond the tracked set still deserves a row.
  const extra = member.socials.filter(
    (s) => !TRACKED_PLATFORMS.includes(s.platform as (typeof TRACKED_PLATFORMS)[number]),
  )

  // Same shape as the event and project modals: svh so the panel matches the
  // viewport actually on screen, auto margins so a tall one starts at its own
  // top instead of overflowing past it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className={cn(
          'relative z-[60] my-auto max-h-[85svh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card font-sans text-card-foreground md:max-h-[90svh]',
          'shadow-[0_18px_50px_-12px_hsl(var(--foreground)/0.35)]',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close member profile"
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid max-h-[85svh] grid-cols-1 gap-6 overflow-y-auto p-3 md:max-h-[90svh] md:grid-cols-[minmax(0,17rem)_1fr] md:gap-8 md:p-8">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
            <img src={member.image} alt={member.fullName} className="h-full w-full object-cover" />
            {member.years && (
              <span className="absolute right-0 top-0 z-10 rounded-bl-[16px] bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                {member.years}
                <CutoutCorner className="absolute -left-[27px] -top-px -rotate-90 text-card" />
                <CutoutCorner className="absolute -bottom-[27px] -right-px -rotate-90 text-card" />
              </span>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                {member.fullName}
              </h2>
              {currentRole && (
                <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-primary">
                  {currentRole}
                </p>
              )}
            </div>

            {previousRoles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Previously
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {previousRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {member.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Socials
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TRACKED_PLATFORMS.map((platform) => (
                  <SocialRow key={platform} platform={platform} url={byPlatform.get(platform)} />
                ))}
                {extra.map((s) => (
                  <SocialRow key={`${s.platform}-${s.url}`} platform={s.platform} url={s.url} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
