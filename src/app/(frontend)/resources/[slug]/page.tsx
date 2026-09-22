import { JsonLdScript } from '@/components/common/jsonLdScript'
import { LearningDetail } from '@/components/features/resources/learningDetail'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { breadcrumbJsonLd, learningArticleJsonLd } from '@/lib/structuredData'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface ResourceDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getResource(slug: string) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'resources',
      where: { slug: { equals: slug } },
      depth: 2,
    })

    return result.docs[0] || null
  } catch (error) {
    console.error('[Resource Detail] Error fetching resource:', error)
    return null
  }
}

export async function generateMetadata({ params }: ResourceDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const resource = await getResource(slug)

  if (!resource) return { title: 'Resource Not Found' }

  return {
    title: resource.title,
    description: resource.description,
    alternates: { canonical: `/resources/${slug}` },
    openGraph: {
      title: resource.title,
      description: resource.description ?? undefined,
      type: 'article',
      url: `/resources/${slug}`,
    },
  }
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = await params
  const resource = await getResource(slug)

  if (!resource) {
    notFound()
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <JsonLdScript
          data={[
            learningArticleJsonLd(resource, '/resources'),
            breadcrumbJsonLd([
              { name: 'Resources', path: '/resources' },
              { name: resource.title, path: `/resources/${slug}` },
            ]),
          ]}
        />
        <LearningDetail doc={resource} basePath="/resources" backLabel="resources" />
      </MainbarShell>
    </SidebarShell>
  )
}
