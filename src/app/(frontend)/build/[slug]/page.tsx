import { BuildTargetDetail } from '@/components/features/build/buildTargetDetail'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface BuildTargetPageProps {
  params: Promise<{ slug: string }>
}

async function getBuildTarget(slug: string) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'build-targets',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
    })
    return result.docs[0] || null
  } catch (error) {
    console.error('[Build Target] Error fetching:', error)
    return null
  }
}

export async function generateMetadata({ params }: BuildTargetPageProps): Promise<Metadata> {
  const { slug } = await params
  const target = await getBuildTarget(slug)
  if (!target) return { title: 'Board Not Found' }

  return {
    title: `Build: ${target.title}`,
    description: target.description,
    robots: { index: false, follow: false },
  }
}

export default async function BuildTargetPage({ params }: BuildTargetPageProps) {
  const { slug } = await params
  const target = await getBuildTarget(slug)

  if (!target) notFound()

  return (
    <SidebarShell>
      <MainbarShell>
        <BuildTargetDetail target={target} />
      </MainbarShell>
    </SidebarShell>
  )
}
