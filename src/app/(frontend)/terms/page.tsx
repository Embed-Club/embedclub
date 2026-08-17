import { EmptyState } from '@/components/common/emptyState'
import { LegalDocument } from '@/components/common/legalDocument'
import { getLegalPages } from '@/lib/legal'
import type { Metadata } from 'next'

// ISR so a wording change goes live without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms for using the Embed Club site and registering for club events.',
  alternates: { canonical: '/terms' },
}

export default async function Page() {
  const legal = await getLegalPages()

  return (
    <LegalDocument
      title={legal?.termsTitle || 'Terms & Conditions'}
      content={legal?.terms}
      sections={legal?.termsSections}
      lastUpdated={legal?.lastUpdated}
      empty={
        <EmptyState
          title="Not Published Yet"
          message="The terms have not been written into the CMS yet."
        />
      }
    />
  )
}
