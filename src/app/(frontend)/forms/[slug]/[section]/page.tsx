import { EmptyState } from '@/components/common/emptyState'
import { FormImage } from '@/components/features/forms/formImage'
import { FormWizard } from '@/components/features/forms/formWizard'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { getFormBySlug, getSection, withResolvedSteps } from '@/lib/formQueries'
import { getLegalPages } from '@/lib/legal'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface SectionPageProps {
  params: Promise<{ slug: string; section: string }>
}

/**
 * One section of a container form - the A section, or day two.
 *
 * It renders exactly like a standalone form; the only difference is that it
 * says which section it is and links back to the others, because someone
 * arriving from a shared link needs to know they are on the right one.
 */
export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { slug, section } = await params
  const doc = await getSection(slug, section)
  if (!doc) return { title: 'Form Not Found' }

  const container = await getFormBySlug(slug)
  return {
    title: doc.sectionLabel ? `${container?.title ?? doc.title} - ${doc.sectionLabel}` : doc.title,
    description: doc.description || container?.description || undefined,
    alternates: { canonical: `/forms/${slug}/${section}` },
    // Forms are interactive, single-use pages - keep them out of the index.
    robots: { index: false, follow: true },
  }
}

export default async function FormSectionPage({ params }: SectionPageProps) {
  const { slug, section } = await params
  const doc = await getSection(slug, section)

  if (!doc) notFound()

  const [container, legal] = await Promise.all([getFormBySlug(slug), getLegalPages()])
  // The section asks its parent's questions; the id stays the section's, so the
  // response is recorded against the group that gave it.
  const form = await withResolvedSteps(doc)
  const closed =
    !doc.active || (doc.deadline ? new Date(doc.deadline).getTime() < Date.now() : false)

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-20 space-y-8">
          <div className="text-center space-y-3">
            <Link
              href={`/forms/${slug}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {container?.title ?? 'All sections'}
            </Link>
            <h1 className="text-[34px] md:text-[42px] font-extrabold tracking-tight">
              {doc.sectionLabel || doc.title}
            </h1>
            {(doc.description || container?.description) && (
              <p className="text-muted-foreground max-w-xl mx-auto">
                {doc.description || container?.description}
              </p>
            )}
          </div>

          <FormImage media={doc.headerImage ?? container?.headerImage} slot="header" priority />

          {closed ? (
            <EmptyState
              title="This Form Is Closed"
              message="Submissions are no longer accepted - contact the organizers if you think this is a mistake."
            />
          ) : (
            <FormWizard form={form} consentNotice={legal?.consentNotice} />
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
