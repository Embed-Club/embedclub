import './globals.css'
import ThemeWrapper from '@/components/theme/themeWrapper'
import { getServerSideURL } from '@/lib/getUrl'
import type { Metadata } from 'next'
import { gobold, sportBreak, texGyreAdventor } from './fonts'

const SITE_URL = getServerSideURL()
const SITE_NAME = 'Embed Club'
const SITE_DESCRIPTION =
  'Student-run embedded systems & IoT club at PA College of Engineering, Mangalore. We build, break, and ship - turning circuits and code into things that work.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Embed Club',
    'embedded systems',
    'IoT',
    'PA College of Engineering',
    'Mangalore',
    'robotics',
    'microcontrollers',
    'student club',
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/embedClubLogo-Dark.svg', type: 'image/svg+xml' }],
    apple: '/embedClubLogo-Dark.svg',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/embedClubLogo-Dark.svg`,
      description: SITE_DESCRIPTION,
      location: {
        '@type': 'Place',
        name: 'PA College of Engineering',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Mangalore',
          addressRegion: 'Karnataka',
          addressCountry: 'IN',
        },
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${texGyreAdventor.variable} ${gobold.variable} ${sportBreak.variable}`}
    >
      <head />
      <body className={`${texGyreAdventor.className} font-medium`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static, app-authored JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
