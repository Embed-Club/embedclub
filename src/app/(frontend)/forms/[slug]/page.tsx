import { EmptyState } from '@/components/common/emptyState'
import { formToCard } from '@/components/features/forms/formCardData'
import { FormHeader } from '@/components/features/forms/formHeader'
import { FormWizard } from '@/components/features/forms/formWizard'
import { FormsListing } from '@/components/features/forms/formsListing'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { getFormBySlug, getSections } from '@/lib/formQueries'
import { getLegalPages } from '@/lib/legal'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface FormPageProps {
  params: Promise<{ slug: string }>
}

const getForm = getFormBySlug

export async function generateMetadata({ params }: FormPageProps): Promise<Metadata> {
  const { slug } = await params
  const form = await getForm(slug)
  if (!form) return { title: 'Form Not Found' }
  return {
    title: form.title,
    description: form.description || undefined,
    alternates: { canonical: `/forms/${slug}` },
    // Forms are interactive, single-use pages - keep them out of the index.
    robots: { index: false, follow: true },
  }
}

export default async function FormPage({ params }: FormPageProps) {
  const { slug } = await params
  const [form, legal] = await Promise.all([getForm(slug), getLegalPages()])

  if (!form) notFound()

  // A section is only reachable through its container, so its bare slug is not
  // an address. Redirecting would be friendlier, but this URL was never handed
  // out - the links have always been the nested ones.
  if (form.sectionOf) notFound()

  const closed =
    !form.active || (form.deadline ? new Date(form.deadline).getTime() < Date.now() : false)

  // A container asks nothing itself: it exists so that two ways of answering
  // the same thing - A and B sections, day one and day two - read as one form
  // with a choice in it.
  if (form.sectionGroup) {
    const sections = await getSections(form.id)
    const now = Date.now()

    return (
      <SidebarShell>
        <MainbarShell>
          <div className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-20 md:px-6 md:pt-28">
            <FormHeader
              title={form.title}
              description={form.description}
              headerImage={form.headerImage}
            />
            <p className="px-1 text-sm text-muted-foreground">
              Pick the one you are in. Each keeps its own responses.
            </p>
            <FormsListing
              cards={sections.map((section) => formToCard(section, now))}
              emptyTitle="No Sections Yet"
              compact
            />
          </div>
        </MainbarShell>
      </SidebarShell>
    )
  }

  return (
    <SidebarShell>
      <MainbarShell>
        {/* Google Forms' column width: questions read one per card, top to
            bottom, and a wide column only stretches the inputs. */}
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-20 md:px-6 md:pt-28">
          {closed ? (
            <div className="space-y-4">
              <FormHeader
                title={form.title}
                description={form.description}
                headerImage={form.headerImage}
              />
              <EmptyState
                title="This Form Is Closed"
                message="Submissions are no longer accepted - contact the organizers if you think this is a mistake."
              />
            </div>
          ) : (
            <FormWizard form={form} consentNotice={legal?.consentNotice} />
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
