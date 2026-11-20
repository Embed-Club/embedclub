'use client'

import {
  DOCK_IDS,
  setDockTheme,
  setScrollbarPalette,
} from '@/components/features/embedthon/chromeTheme'
import { useEmbedthonReveal } from '@/components/features/embedthon/embedthonRevealContext'
import { FloatingDock } from '@/components/ui/floatingDock'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Cpu,
  FileText,
  House,
  MapPin,
  Ticket,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

const DESKTOP_DOCK = DOCK_IDS[0]
const MOBILE_DOCK = DOCK_IDS[1]

const EMBERS_NAV_ITEMS = [
  {
    title: 'Home',
    icon: <House className="h-full w-full stroke-[1.6]" />,
    href: '#top',
  },
  {
    title: 'The Brief',
    icon: <FileText className="h-full w-full stroke-[1.6]" />,
    href: '#brief',
  },
  {
    title: 'Roadmap',
    icon: <Cpu className="h-full w-full stroke-[1.6]" />,
    href: '#roadmap',
  },
  {
    title: 'Schedule',
    icon: <CalendarDays className="h-full w-full stroke-[1.6]" />,
    href: '#schedule',
  },
  {
    title: 'Tracks',
    icon: <BookOpen className="h-full w-full stroke-[1.6]" />,
    href: '#tracks',
  },
  {
    title: 'Venue',
    icon: <MapPin className="h-full w-full stroke-[1.6]" />,
    href: '#venue',
  },
  {
    title: 'Register',
    icon: <Ticket className="h-full w-full stroke-[1.6]" />,
    href: '#register',
  },
  {
    title: 'Embed Days',
    icon: <Cpu className="h-full w-full stroke-[1.6]" />,
    href: '/embed-days',
  },
  {
    title: 'Embed Club',
    icon: <ArrowLeft className="h-full w-full stroke-[1.6]" />,
    href: '/',
  },
]

/**
 * The surface the dock is sitting on. Sections on this page paint their own
 * background and say which palette it is with a `.light` / `.dark` class, so
 * walking up from the element under the dock finds the colour that is really
 * there. The walk stops at the page container: above that point the classes
 * describe the document, not a section.
 */
function themedSurface(element: Element | null): Element | null {
  let node: Element | null = element

  while (node && node.id !== 'top') {
    const declared = node.getAttribute('data-theme')
    if (declared === 'light' || declared === 'dark') return node
    if (node.classList.contains('dark') || node.classList.contains('light')) return node
    node = node.parentElement
  }

  return null
}

/** Palette a themed surface declares. */
function paletteOf(surface: Element | null): 'light' | 'dark' | null {
  if (!surface) return null
  const declared = surface.getAttribute('data-theme')
  if (declared === 'light' || declared === 'dark') return declared
  return surface.classList.contains('dark') ? 'dark' : 'light'
}

export function EmbedthonNav() {
  const { isRevealed } = useEmbedthonReveal()
  const { resolvedTheme } = useTheme()

  /*
   * The dock floats above every section, so it cannot inherit the palette of the
   * thing behind it, and the global theme is not that palette either: this page
   * flips the document to light once the hero wave is done, then keeps painting
   * dark sections (the schedule, the footer) further down. So ask the page what
   * is actually under the dock - the nearest surface that declares `.light` or
   * `.dark` - and fall back to the global theme for surfaces that do not. The
   * scrollbar is drawn by the document and has the same problem, so it takes its
   * palette from the same answer.
   */
  useEffect(() => {
    let lastSurface: Element | null | undefined

    const sync = () => {
      const dock = document.getElementById(
        window.matchMedia('(min-width: 768px)').matches ? DESKTOP_DOCK : MOBILE_DOCK,
      )
      if (!dock) return

      const rect = dock.getBoundingClientRect()
      // Sample just beside the pill, so the hit test lands on the page rather
      // than on the dock itself.
      const x = rect.left > 32 ? rect.left - 16 : rect.right + 16
      const surface = themedSurface(document.elementFromPoint(x, rect.top + rect.height / 2))
      const fallback = resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : null
      const theme = paletteOf(surface) ?? fallback

      if (theme) setDockTheme(theme)

      // The scrollbar is drawn by the document, so it needs the same surface
      // palette spelled out for it - repainting it on every scroll frame is
      // wasted work, so only when the surface actually changes.
      if (surface !== lastSurface) {
        setScrollbarPalette(surface)
        lastSurface = surface
      }
    }

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [resolvedTheme])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed bottom-6 left-0 right-0 w-full z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="pointer-events-auto">
        <FloatingDock items={EMBERS_NAV_ITEMS} />
      </div>
    </motion.div>
  )
}
