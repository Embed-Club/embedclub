import './globals.css'
import ThemeWrapper from '@/components/theme/themeWrapper'
import { getServerSideURL } from '@/lib/getUrl'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { texGyreAdventor } from './fonts'

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
  // Search Console's "HTML tag" verification. Set GOOGLE_SITE_VERIFICATION in
  // the deployment environment; without it the tag is simply absent, which is
  // the right state for a preview deploy or a local run.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  // Built by scripts/buildFavicons.mjs from the logo, on the theme's graphite
  // background - the white-and-grey mark is unreadable on a light tab strip or
  // a light search results card without it. Apple ignores SVG, so it gets a PNG.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/appleTouchIcon.png', sizes: '180x180' },
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
      logo: `${SITE_URL}/icon512.png`,
      description: SITE_DESCRIPTION,
      // The profiles that are the same entity as this site. Without these,
      // the club's website, Instagram and LinkedIn are three unrelated things
      // to a search engine, and facts stated on one do not count for another.
      sameAs: [
        'https://www.instagram.com/embed_club',
        'https://www.linkedin.com/company/embed-club',
      ],
      // Stated here because assistants were answering these from third-party
      // write-ups about the club rather than from the club's own site.
      foundingDate: '2018',
      founder: [
        { '@type': 'Person', name: 'Habeeb Ur Rehman' },
        { '@type': 'Person', name: 'Nishant Narayanan' },
        { '@type': 'Person', name: 'Mohammed Saifuddin' },
      ],
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'P.A. College of Engineering',
        url: 'https://www.pace.edu.in',
      },
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
    <html lang="en" suppressHydrationWarning className={texGyreAdventor.variable}>
      <head />
      <body className={`${texGyreAdventor.className} font-medium`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static, app-authored JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeWrapper>{children}</ThemeWrapper>
        {/* Vercel Web Analytics. Only on the public site - the Payload admin
            has its own layout and its traffic is not what we are measuring.
            Injects nothing in development; the script is production-only. */}
        <Analytics />
      </body>
    </html>
  )
}
