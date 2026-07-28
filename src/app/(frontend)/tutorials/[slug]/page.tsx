import { LearningDetail } from '@/components/features/resources/learningDetail'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface TutorialDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getTutorial(slug: string) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutorials',
      where: { slug: { equals: slug } },
      depth: 2,
    })

    return result.docs[0] || null
  } catch (error) {
    console.error('[Tutorial Detail] Error fetching tutorial:', error)
    return null
  }
}

export async function generateMetadata({ params }: TutorialDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const tutorial = await getTutorial(slug)

  if (!tutorial) return { title: 'Tutorial Not Found' }

  return {
    title: tutorial.title,
    description: tutorial.description,
    alternates: { canonical: `/tutorials/${slug}` },
    openGraph: {
      title: tutorial.title,
      description: tutorial.description ?? undefined,
      type: 'article',
      url: `/tutorials/${slug}`,
    },
  }
}

export default async function TutorialDetailPage({ params }: TutorialDetailPageProps) {
  const { slug } = await params
  const tutorial = await getTutorial(slug)

  if (!tutorial) {
    notFound()
  }

  return (
    <SidebarShell>
      <MainbarShell>
        <LearningDetail doc={tutorial} basePath="/tutorials" backLabel="tutorials" />
      </MainbarShell>
    </SidebarShell>
  )
}
