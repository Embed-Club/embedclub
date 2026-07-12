import { EmptyState } from '@/components/common/EmptyState'
import { CertificateGenerator } from '@/components/features/feedback/CertificateGenerator'
import { FormWizard } from '@/components/features/forms/form-wizard'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
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
    title: `${form.title} | Embed Club`,
    description: form.description || undefined,
  }
}

export default async function FormPage({ params }: FormPageProps) {
  const { slug } = await params
  const form = await getForm(slug)

  if (!form) notFound()

  const closed =
    !form.active || (form.deadline ? new Date(form.deadline).getTime() < Date.now() : false)

  const certificateTemplate =
    form.showCertificate && typeof form.certificateTemplate === 'object'
      ? form.certificateTemplate?.url
      : null

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-20 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground max-w-xl mx-auto">{form.description}</p>
            )}
          </div>

          {closed ? (
            <EmptyState
              title="This Form Is Closed"
              message="Submissions are no longer accepted — contact the organizers if you think this is a mistake."
            />
          ) : (
            <FormWizard
              form={form}
              successExtra={
                certificateTemplate ? (
                  <CertificateGenerator
                    templateUrl={certificateTemplate}
                    config={{
                      nameX: form.certificateConfig?.nameX || 400,
                      nameY: form.certificateConfig?.nameY || 300,
                      fontSize: form.certificateConfig?.fontSize || 40,
                      color: form.certificateConfig?.color || '#000000',
                    }}
                  />
                ) : undefined
              }
            />
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
