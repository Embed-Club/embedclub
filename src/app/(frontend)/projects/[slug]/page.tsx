import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import { ChevronLeft, ExternalLink, Github } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>
}

async function getProject(slug: string) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      depth: 2,
    })

    return result.docs[0] || null
  } catch (error) {
    console.error('[Project Detail] Error fetching project:', error)
    return null
  }
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) return { title: 'Project Not Found' }

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: project.title,
      description: project.description ?? undefined,
      type: 'article',
      url: `/projects/${slug}`,
    },
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) {
    notFound()
  }

  const team = Array.isArray(project.team)
    ? project.team.filter((m) => typeof m === 'object' && m !== null)
    : []

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="w-full min-h-screen bg-[#09090b] text-zinc-100 pb-24">
          <div className="relative w-full py-16 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 md:mb-10"
              >
                <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </div>
                Back to projects
              </Link>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {project.tags?.map((tag) => {
                    const tagObj = typeof tag === 'object' ? tag : null
                    return tagObj ? (
                      <span
                        key={tagObj.id}
                        className="px-3 py-1 text-xs font-medium bg-white/5 text-zinc-300 border border-white/10 rounded-full"
                      >
                        {tagObj.name}
                      </span>
                    ) : null
                  })}
                </div>

                {project.award && (
                  <div>
                    <p className="text-2xl font-bold uppercase tracking-tight text-primary md:text-3xl">
                      {project.award}
                    </p>
                    {(project.event || project.year) && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        {[project.event, project.year ? String(project.year) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                )}

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl leading-[1.1]">
                  {project.title}
                </h1>

                <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
                  {project.description}
                </p>

                {team.length > 0 && (
                  <p className="text-sm text-zinc-500">
                    Built by {team.map((m) => (typeof m === 'object' ? m.fullName : '')).join(', ')}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Github className="h-4 w-4" />
                      Source code
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live demo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 mt-12">
            <div className="max-w-4xl">
              <BlockRenderer blocks={project.content || []} />
            </div>
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
