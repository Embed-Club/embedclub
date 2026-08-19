import { EmptyState } from '@/components/common/emptyState'
import { LegalDocument } from '@/components/common/legalDocument'
import { ContactLinks } from '@/components/features/contact/contactLinks'
import { SupportFaq } from '@/components/features/contact/supportFaq'
import { getSupportPages } from '@/lib/support'
import type { Metadata } from 'next'

// ISR so a wording change goes live without a redeploy.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Support answers and how to reach Embed Club by email or phone.',
  alternates: { canonical: '/contact' },
}

export default async function Page() {
  const support = await getSupportPages()
  const email = support?.contactEmail
  const phone = support?.contactPhone

  return (
    <LegalDocument
      title={support?.contactTitle || 'Contact'}
      content={support?.contact}
      sections={support?.contactSections}
      extra={
        <>
          {(email || phone) && <ContactLinks email={email} phone={phone} />}
          <SupportFaq items={support?.supportFaq} />
        </>
      }
      empty={
        <EmptyState
          title="Not Published Yet"
          message="The contact page has not been written into the CMS yet."
        />
      }
    />
  )
}
