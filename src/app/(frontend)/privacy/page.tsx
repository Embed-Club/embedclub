import { EmptyState } from '@/components/common/emptyState'
import { LegalDocument } from '@/components/common/legalDocument'
import { getLegalPages } from '@/lib/legal'
import type { Metadata } from 'next'

// ISR so a wording change goes live without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Embed Club collects, why, how long it is kept, and how to have it removed.',
  alternates: { canonical: '/privacy' },
}

export default async function Page() {
  const legal = await getLegalPages()

  return (
    <LegalDocument
      title={legal?.privacyTitle || 'Privacy Policy'}
      content={legal?.privacy}
      sections={legal?.privacySections}
      lastUpdated={legal?.lastUpdated}
      empty={
        <EmptyState
          title="Not Published Yet"
          message="The privacy policy has not been written into the CMS yet."
        />
      }
    />
  )
}
