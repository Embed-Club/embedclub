import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import { BarChart, Calendar, ChevronLeft, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
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
      where: {
        slug: {
          equals: slug,
        },
      },
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

  const formattedDate = resource.lastUpdated
    ? new Date(resource.lastUpdated).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(resource.updatedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="w-full min-h-screen bg-[#09090b] text-zinc-100 pb-24">
          {/* Hero Section */}
          <div className="relative w-full py-16 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl">
              <Link
                href="/resources"
                className="group inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 md:mb-10"
              >
                <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                Back to resources
              </Link>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {resource.tags?.map((tag) => {
                    const tagObj = typeof tag === 'object' ? tag : null
                    return tagObj ? (
                      <span
                        key={tagObj.id}
                        className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full"
                      >
                        {tagObj.name}
                      </span>
                    ) : null
                  })}
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl leading-[1.1]">
                  {resource.title}
                </h1>

                <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
                  {resource.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last updated {formattedDate}</span>
                  </div>

                  {resource.estimatedReadTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{resource.estimatedReadTime} min read</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span className="capitalize">{resource.difficulty} difficulty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="container mx-auto px-6 mt-12">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1 max-w-4xl">
                <BlockRenderer blocks={resource.content || []} />
              </div>

              {/* Table of Contents / Sidebar - Placeholder for now */}
              <aside className="hidden lg:block w-64 h-fit sticky top-32">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                    On this page
                  </h4>
                  <nav className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 italic">
                      Table of contents generated automatically from headings...
                    </p>
                  </nav>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
