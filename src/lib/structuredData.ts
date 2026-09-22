import { getServerSideURL } from '@/lib/getUrl'
import type { Event, Resource, Tutorial } from '@/payload/payload-types'

/**
 * JSON-LD builders.
 *
 * Search engines and the assistants built on them answer questions by quoting
 * pages they can parse confidently. Prose alone leaves them guessing what a
 * page is, when it was written and who published it; this states it outright.
 *
 * Everything here points back at the Organization declared in the root layout
 * (`#organization`), so the whole site reads as one publisher rather than a
 * pile of unrelated pages.
 */

const SITE_URL = getServerSideURL()
const ORGANIZATION_ID = `${SITE_URL}/#organization`

/** JSON-LD is free-form by nature - this is the shape, not a schema. */
export type JsonLd = Record<string, unknown>

/** Absolute URL for a media object that may be a populated doc or just an id. */
function mediaUrl(image: unknown): string | undefined {
  if (typeof image === 'object' && image !== null && 'url' in image) {
    const url = (image as { url?: string | null }).url
    if (url) return url.startsWith('http') ? url : `${SITE_URL}${url}`
  }
  return undefined
}

/**
 * A resource or tutorial page.
 *
 * `LearningResource` alongside `TechArticle` is deliberate: the first says what
 * the page is for (teaching, at a stated level), the second says what it is.
 * Assistants asked "how do I flash an ESP32" want the second; ones asked "where
 * can I learn embedded systems" want the first.
 */
export function learningArticleJsonLd(
  doc: Resource | Tutorial,
  basePath: '/resources' | '/tutorials',
): JsonLd {
  const url = `${SITE_URL}${basePath}/${doc.slug}`
  const image = mediaUrl(doc.thumbnail)

  const keywords = Array.isArray(doc.tags)
    ? doc.tags
        .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
        .filter((name): name is string => Boolean(name))
    : []

  return {
    '@context': 'https://schema.org',
    '@type': ['TechArticle', 'LearningResource'],
    '@id': `${url}#article`,
    headline: doc.title,
    name: doc.title,
    description: doc.description,
    url,
    inLanguage: 'en',
    // No per-document author field exists, and inventing one would be worse
    // than naming the club that published it.
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntityOfPage: url,
    datePublished: doc.createdAt,
    dateModified: doc.updatedAt,
    ...(image ? { image } : {}),
    ...(keywords.length ? { keywords } : {}),
    ...(doc.difficulty
      ? {
          educationalLevel: doc.difficulty,
          // Repeated as an audience because the two are read by different
          // consumers and neither implies the other.
          educationalUse: basePath === '/tutorials' ? 'Tutorial' : 'Reference',
        }
      : {}),
    ...(doc.estimatedReadTime ? { timeRequired: `PT${doc.estimatedReadTime}M` } : {}),
    isAccessibleForFree: true,
    learningResourceType: basePath === '/tutorials' ? 'Tutorial' : 'Reference material',
  }
}

/** The trail into a detail page, so results can show it rather than a bare URL. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  }
}

/** One club event. Online events carry a URL where in-person ones carry a place. */
function eventJsonLd(event: Event): JsonLd {
  const online = event.eventMode === 'online'
  const image = mediaUrl(event.image)

  const roomName = event.venue?.roomName
  const address = event.location?.address

  return {
    '@type': 'Event',
    '@id': `${SITE_URL}/events#${event.slug ?? event.id}`,
    name: event.title,
    ...(event.shortDescription ? { description: event.shortDescription } : {}),
    startDate: event.eventDate,
    eventAttendanceMode: online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    // Past events keep their status; the club does not cancel and re-list.
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@id': ORGANIZATION_ID },
    ...(image ? { image } : {}),
    location: online
      ? { '@type': 'VirtualLocation', url: event.meetingLink ?? `${SITE_URL}/events` }
      : {
          '@type': 'Place',
          name: roomName || 'PA College of Engineering',
          address: {
            '@type': 'PostalAddress',
            ...(address ? { streetAddress: address } : {}),
            addressLocality: 'Mangalore',
            addressRegion: 'Karnataka',
            addressCountry: 'IN',
          },
        },
  }
}

/**
 * The events page as a list.
 *
 * Events have no page of their own, so each one is described here instead -
 * an assistant asked "what workshops does Embed Club run" has a single
 * document to read rather than having to infer it from cards.
 */
export function eventsListJsonLd(events: Event[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/events#events`,
    name: 'Embed Club events',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: eventJsonLd(event),
    })),
  }
}
