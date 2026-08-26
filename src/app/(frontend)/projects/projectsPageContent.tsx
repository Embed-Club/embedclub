import { EmptyState } from '@/components/common/emptyState'
import { ProjectShowcaseTile } from '@/components/features/projects/projectShowcaseTile'
import type { ReactNode } from 'react'

export interface ProjectCardData {
  id: string
  title: string
  description: string
  /** Null when there is no photo of the build - the tile is typeset instead. */
  image: string | null
  tags: string[]
  slug: string
  teamCount: number
  teamNames: string[]
  /** Placing or grant, e.g. "Winner" or "KSCST Grant · ₹5,000". */
  award?: string
  /** Where it was won, e.g. "ADC 2023". */
  event?: string
  year?: number
  repoUrl?: string
  demoUrl?: string
  /**
   * The write-up, pre-rendered on the server. The block renderer is a server
   * component, so the modal (a client component) is handed the finished node
   * rather than the raw blocks.
   */
  details?: ReactNode
  createdAt?: string
}

export type TileSize = 1 | 2

/**
 * How much room a project has earned, before the pairing gets a say.
 *
 * Size follows the content rather than the position in the list: a photo needs
 * room to read as a photo, and a long award - "KSCST Grant · ₹5,000" - needs
 * room to stay on one line at the size the type-led tile sets it. Cycling spans
 * by index gave big tiles to one-word awards and squeezed the long ones, which
 * is what made the old grid feel arbitrary.
 */
function contentWeight(project: ProjectCardData): number {
  let weight = 0

  if (project.image) weight += 2

  const awardLength = project.award?.length ?? 0
  if (awardLength >= 18) weight += 2
  else if (awardLength >= 10) weight += 1

  if (project.description.length > 100) weight += 1
  if (project.teamNames.length >= 5) weight += 1

  return weight
}

/** Fisher-Yates, so every ordering of the showcase is equally likely. */
function shuffle(projects: ProjectCardData[]): ProjectCardData[] {
  const shuffled = [...projects]

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]]
  }

  return shuffled
}

/**
 * Deal the projects into rows of two, one wide and one narrow, at random.
 *
 * Both the order and the wide side are redrawn on every request, so the grid a
 * reader meets is never the one before it. The one thing left to the content is
 * a tile that would be cramped at a single column - a photo, or an award as long
 * as "KSCST Grant · ₹5,000" - which keeps the wide slot when it is paired
 * against something plainer. A project left over at the end takes two columns on
 * its own rather than stretching across the track.
 */
function sizeProjects(projects: ProjectCardData[]): { project: ProjectCardData; size: TileSize }[] {
  const sized: { project: ProjectCardData; size: TileSize }[] = []
  const dealt = shuffle(projects)

  for (let index = 0; index < dealt.length; index += 2) {
    const [first, second] = [dealt[index], dealt[index + 1]]

    if (!second) {
      sized.push({ project: first, size: 2 })
      break
    }

    const difference = contentWeight(first) - contentWeight(second)
    const firstIsWide = Math.abs(difference) >= 2 ? difference > 0 : Math.random() < 0.5

    sized.push(
      { project: first, size: firstIsWide ? 2 : 1 },
      { project: second, size: firstIsWide ? 1 : 2 },
    )
  }

  return sized
}

const COLUMN_SPAN: Record<TileSize, string> = {
  1: 'lg:col-span-1',
  2: 'sm:col-span-2 lg:col-span-2',
}

interface ProjectsPageContentProps {
  projects?: ProjectCardData[]
}

/**
 * The projects showcase: the club's wins, dealt afresh on every page load.
 *
 * members only add projects - there is no order to curate and no size to pick,
 * because the grid works both out for itself. No search, filters or sorting
 * either: this is a short list of things the club is proud of, not a searchable
 * archive. Keeping it a server component also means the arrangement is settled
 * before the page is sent, so nothing re-shuffles under the reader.
 */
export function ProjectsPageContent({ projects = [] }: ProjectsPageContentProps) {
  if (projects.length === 0) {
    return <EmptyState title="No Projects Yet" />
  }

  return (
    // Fixed row height, not min-height: every tile is the same size no matter
    // how long its title runs, so nothing in the grid can resize or reflow
    // while the page scrolls.
    <div className="grid w-full auto-rows-[16rem] grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:auto-rows-[18rem] lg:grid-cols-3">
      {sizeProjects(projects).map(({ project, size }) => (
        <div key={project.id} className={COLUMN_SPAN[size]}>
          <ProjectShowcaseTile card={project} size={size} />
        </div>
      ))}
    </div>
  )
}
