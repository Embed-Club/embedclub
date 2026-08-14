import { EmptyState } from '@/components/common/emptyState'
import { FormImage } from '@/components/features/forms/formImage'
import { FormWizard } from '@/components/features/forms/formWizard'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface FormPageProps {
  params: Promise<{ slug: string }>
}

async function getForm(slug: string) {
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

export async function generateMetadata({ params }: FormPageProps): Promise<Metadata> {
  const { slug } = await params
  const form = await getForm(slug)
  if (!form) return { title: 'Form Not Found' }
  return {
    title: form.title,
    description: form.description || undefined,
    alternates: { canonical: `/forms/${slug}` },
    // Forms are interactive, single-use pages — keep them out of the index.
    robots: { index: false, follow: true },
  }
}

export default async function FormPage({ params }: FormPageProps) {
  const { slug } = await params
  const form = await getForm(slug)

  if (!form) notFound()

  const closed =
    !form.active || (form.deadline ? new Date(form.deadline).getTime() < Date.now() : false)

  return (
    <SidebarShell>
      <MainbarShell>
        {/* Wider than a typical prose column: the step card lays questions out
            two-up on desktop, so 768px squeezed a pair of half-width fields
            into something narrower than either deserved. */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-20 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground max-w-xl mx-auto">{form.description}</p>
            )}
          </div>

          <FormImage media={form.headerImage} slot="header" priority />

          {closed ? (
            <EmptyState
              title="This Form Is Closed"
              message="Submissions are no longer accepted — contact the organizers if you think this is a mistake."
            />
          ) : (
            <FormWizard form={form} />
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
