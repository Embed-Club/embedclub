import {
  type ProjectCardData,
  ProjectsPageContent,
} from '@/app/(frontend)/projects/projectsPageContent'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR: rebuild this page at most every 60s so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Builds and experiments from the Embed Club workbench.',
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop'

async function getProjects(): Promise<ProjectCardData[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'projects',
      depth: 1,
      limit: 100,
      pagination: false,
      // Drag-arranged order from the admin list view, top row first
      sort: '_order',
    })

    return result.docs.map((project) => {
      let imageUrl = FALLBACK_IMAGE

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

      return {
        id: String(project.id),
        title: project.title || '',
        description: project.description || '',
        image: imageUrl,
        tags,
        slug: project.slug || '',
        status: project.status || 'inProgress',
        teamCount: Array.isArray(project.team) ? project.team.length : 0,
        createdAt: project.createdAt,
      }
    })
  } catch (error) {
    console.error('[Projects] Error fetching from Payload:', error)
    return []
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
