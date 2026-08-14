import 'server-only'

import type { Form } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * Lookups shared by the form page and its section pages.
 *
 * A form is either standalone, a container, or a section of a container. The
 * container holds the title, description and event; the sections hold the
 * questions and collect their own responses, because that is how the answers
 * were gathered — an A section and a B section are two sets of replies, not one.
 */
export async function getFormBySlug(slug: string): Promise<Form | null> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return result.docs[0] || null
  } catch (error) {
    console.error('[Forms] Error fetching form:', error)
    return null
  }
}

/** The sections under a container, in the order officers set. */
export async function getSections(containerId: number | string): Promise<Form[]> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'forms',
      where: { sectionOf: { equals: containerId } },
      // Explicit order first; ties and unset values fall back to the title, so
      // the list is at least stable rather than in insertion order.
      sort: ['sectionOrder', 'title'],
      limit: 50,
      depth: 1,
    })
    return result.docs
  } catch (error) {
    console.error('[Forms] Error fetching sections:', error)
    return []
  }
}

/** One section of a container, addressed the way the URL addresses it. */
export async function getSection(containerSlug: string, sectionSlug: string): Promise<Form | null> {
  const container = await getFormBySlug(containerSlug)
  if (!container?.sectionGroup) return null

  const sections = await getSections(container.id)
  return sections.find((section) => section.sectionSlug === sectionSlug) ?? null
}
