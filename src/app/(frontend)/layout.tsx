import './globals.css'
import ThemeWrapper from '@/components/theme/ThemeWrapper'
import { avantGarde } from './fonts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embed Club',
  description: 'A platform for embedded systems enthusiasts',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/embedClubLogo-Dark.svg', type: 'image/svg+xml' }
    ],
    apple: '/embedClubLogo-Dark.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={avantGarde.variable}>
      <head />
      <body className={`${avantGarde.className} font-medium`} suppressHydrationWarning>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
