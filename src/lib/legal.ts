import type { LegalPage } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'

/**
 * The privacy policy, terms, and the consent line shown beside every form's
 * tick-box.
 *
 * Unlike the content globals, a failure here returns null rather than throwing.
 * The form pages read this only for the consent wording, and taking a
 * registration form down because the policy row could not be read would cost
 * the club sign-ups to fix nothing — the wizard falls back to its built-in
 * sentence, which says the same thing. `/privacy` and `/terms` render their own
 * empty state when it comes back null.
 */
export async function getLegalPages(): Promise<LegalPage | null> {
  try {
    const payload = await getPayload({ config })
    return await payload.findGlobal({ slug: 'legal-pages' })
  } catch (error) {
    console.error('[Legal] Error fetching global:', error)
    return null
  }
}
