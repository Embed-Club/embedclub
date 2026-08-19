import type { SupportPage } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * The contact page, support FAQ included. Same null-on-failure contract as
 * `getLegalPages` - /contact renders its own empty state when this comes back
 * null, rather than taking the page down.
 */
export async function getSupportPages(): Promise<SupportPage | null> {
  try {
    const payload = await getPayload({ config })
    return await payload.findGlobal({ slug: 'support-pages' })
  } catch (error) {
    console.error('[Support] Error fetching global:', error)
    return null
  }
}
