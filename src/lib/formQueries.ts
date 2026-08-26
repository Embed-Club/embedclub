import 'server-only'

import type { Form } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * Lookups shared by the form page and its section pages.
 *
 * A form either stands alone, or is answered separately by sections. In the
 * second case the questions live once on the parent and every section asks
 * exactly them; a section exists to keep its own responses apart. That is why
 * answers from every section share one set of field ids, and so can be read
 * together or apart without translating anything.
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

/** The sections under a container, in the order members set. */
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

/** One section of a parent form, addressed the way the URL addresses it. */
export async function getSection(containerSlug: string, sectionSlug: string): Promise<Form | null> {
  const container = await getFormBySlug(containerSlug)
  if (!container?.sectionGroup) return null

  const sections = await getSections(container.id)
  return sections.find((section) => section.sectionSlug === sectionSlug) ?? null
}

/**
 * A form with the questions it actually asks.
 *
 * A section stores none of its own - it asks its parent's - so everything that
 * renders or validates a form has to resolve them first. Returning a merged doc
 * rather than the two halves means callers keep using `form.steps` and
 * `form.id` exactly as they did: the id is still the section's, so a response
 * is recorded against the section that collected it.
 */
export async function withResolvedSteps(form: Form): Promise<Form> {
  if (!form.sectionOf) return form

  const parent =
    typeof form.sectionOf === 'object' ? form.sectionOf : await getFormById(form.sectionOf)

  return { ...form, steps: parent?.steps ?? [] }
}

/** Used when a relationship came back as a bare id rather than a document. */
export async function getFormById(id: number): Promise<Form | null> {
  try {
    const payload = await getPayload({ config })
    return await payload.findByID({ collection: 'forms', id, depth: 0 })
  } catch (error) {
    console.error('[Forms] Error fetching form by id:', error)
    return null
  }
}
