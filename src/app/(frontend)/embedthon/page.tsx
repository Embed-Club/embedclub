import { EmbedthonPageContent } from '@/components/features/embedthon/embedthonPageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embedthon | Agentic AI Workshop and Hackathon | Embed Club',
  description:
    'A two-day Agentic AI workshop and 24-hour hackathon for second-year CSE students at P.A. College of Engineering.',
}

export default function EmbedthonPage() {
  return <EmbedthonPageContent event="embedthon" />
}
