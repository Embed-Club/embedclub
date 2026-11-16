'use client'

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

export function EmbedthonNav() {
  const { isRevealed } = useEmbedthonReveal()

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
