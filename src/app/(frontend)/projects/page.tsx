import {
  type ProjectCardData,
  ProjectsPageContent,
} from '@/app/(frontend)/projects/projectsPageContent'
import { BlockRenderer } from '@/components/features/resources/blockRenderer'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// Rendered per request, not ISR: the showcase deals itself a fresh arrangement
// every time, and a cached page would serve the same "random" grid for a minute
// at a stretch. CMS edits show up immediately as a side effect.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Builds and experiments from the Embed Club workbench.',
}

async function getProjects(): Promise<ProjectCardData[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'projects',
      depth: 1,
      limit: 100,
      pagination: false,
      // Newest first, but only to make the query deterministic — the showcase
      // shuffles this list before laying it out.
      sort: '-createdAt',
    })

    return result.docs.map((project) => {
      // Null, not a stock photo: a project with no picture of the build gets a
      // type-led tile in the showcase grid.
      let imageUrl: string | null = null

      if (project.thumbnail) {
        if (
          typeof project.thumbnail === 'object' &&
          project.thumbnail !== null &&
          project.thumbnail.url
        ) {
          imageUrl = project.thumbnail.url
        } else if (typeof project.thumbnail === 'number') {
          imageUrl = `/api/media/file/${project.thumbnail}`
        }
      }

      const tags = Array.isArray(project.tags)
        ? project.tags
            .map((tag) => (typeof tag === 'object' && tag !== null ? tag.name : null))
            .filter((name): name is string => Boolean(name))
        : []

      const teamNames = Array.isArray(project.team)
        ? project.team
            .map((member) =>
              typeof member === 'object' && member !== null ? member.fullName : null,
            )
            .filter((name): name is string => Boolean(name))
        : []

      return {
        id: String(project.id),
        title: project.title || '',
        description: project.description || '',
        image: imageUrl,
        tags,
        slug: project.slug || '',
        teamCount: teamNames.length,
        teamNames,
        award: project.award || undefined,
        event: project.event || undefined,
        year: project.year ?? undefined,
        repoUrl: project.repoUrl || undefined,
        demoUrl: project.demoUrl || undefined,
        // Rendered here, on the server, so the client-side modal can show the
        // write-up without importing the (server-only) block renderer.
        details: <BlockRenderer blocks={project.content || []} />,
        createdAt: project.createdAt,
      }
    })
  } catch (error) {
    console.error('[Projects] Error fetching from Payload:', error)
    // Rethrow: an empty list here would render as "nothing published yet",
    // which is a different thing than the query having failed. The route
    // error boundary shows the outage and offers a retry.
    throw error
  }
}

export default async function Page() {
  const projects = await getProjects()

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-bold md:text-4xl">
          PROJECTS
        </h1>
        <div className="h-full w-full px-2 pt-16 md:pt-32">
          <ProjectsPageContent projects={projects} />
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
