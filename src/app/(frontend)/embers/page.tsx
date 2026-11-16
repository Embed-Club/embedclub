import { EmbedthonPageContent } from '@/components/features/embedthon/embedthonPageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Embers '26 | National Level Technical Fest | Embed Club",
  description:
    'A national level technical fest organized by Embed Club and Department of Computer Science & Engineering at P.A. College of Engineering, Mangaluru. Project Expo, Paper Presentation, and exciting cash prizes.',
}

export default function EmbersPage() {
  return <EmbedthonPageContent event="embers" />
}
