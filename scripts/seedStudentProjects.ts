/**
 * Seed the club's competition and grant projects into the Projects collection.
 *
 *   pnpm tsx scripts/seedStudentProjects.ts
 *
 * Everything here is taken from the department's student-projects list: title,
 * the member who led the team, the year, and the result (ADC / Kaushal placing,
 * or the KSCST grant). Nothing else about these builds is written down anywhere,
 * so each detail page carries those facts and an explicit note that the write-up
 * is still to come - inventing circuit descriptions would be worse than an
 * honest gap.
 *
 * The result lives in `award` / `event` / `year` rather than inside the
 * description sentence, because the showcase grid typesets it as the headline.
 * No thumbnails: there are no photos of these builds, and the grid gives an
 * image-less project a type-led tile, which beats six identical placeholders.
 *
 * Team members are named in prose rather than linked through the `team`
 * relationship: only first names are on record, and guessing at Members
 * documents would attach the wrong people. Matched on slug, so re-running
 * updates in place.
 *
 * NOTE: local and production share one database - this is live the moment it runs.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
  bold,
  ensureTagIds,
  flushExit,
  heading,
  italic,
  list,
  paragraph,
  text,
  textBlock,
} from './lib/learningSeed'

interface SeedProject {
  slug: string
  title: string
  /** Card summary - what the build is, without the award (that is a field). */
  description: string
  /** Who led it, as recorded. */
  team: string
  year: number
  /** The placing or grant, shown large on the showcase card. */
  award: string
  /** Where it was won. */
  event: string
  tags: string[]
}

const PROJECTS: SeedProject[] = [
  {
    slug: 'smart-wheelchair',
    title: 'Smart Wheelchair',
    description: 'An assistive mobility build by Fidhana and team.',
    team: 'Fidhana and team',
    year: 2023,
    award: 'Second Place',
    event: 'ADC',
    tags: ['Assistive Tech', 'Competition'],
  },
  {
    slug: 'sanitary-pad-vending-machine',
    title: 'Sanitary Pad Vending Machine',
    description: 'A campus dispensing machine by Shabnaz and team.',
    team: 'Shabnaz and team',
    year: 2021,
    award: 'Winner',
    event: 'ADC 2023',
    tags: ['Automation', 'Competition'],
  },
  {
    slug: 'smart-head-massager',
    title: 'Smart Head Massager',
    description: 'A wearable massager by Shabnaz and team.',
    team: 'Shabnaz and team',
    year: 2023,
    award: 'First Place',
    event: 'Kaushal',
    tags: ['Wearables', 'Competition'],
  },
  {
    slug: 'smart-food-detection',
    title: 'Smart Food Detection',
    description: 'A food-detection build by Imad and team.',
    team: 'Imad and team',
    year: 2021,
    award: 'KSCST Grant · ₹5,000',
    event: 'KSCST',
    tags: ['Sensors', 'Grant'],
  },
  {
    slug: 'beegen',
    title: 'Beegen',
    description: 'A build by Jouhar and team.',
    team: 'Jouhar and team',
    year: 2022,
    award: 'First Prize',
    event: 'Kaushal · ADC finalist',
    tags: ['Competition'],
  },
  {
    slug: 'smartnav-ar-navigation',
    title: 'SmartNav AR Navigation',
    description: 'Indoor positioning using augmented reality, by Hafiz and team.',
    team: 'Hafiz and team',
    year: 2021,
    award: 'Second Prize',
    event: 'Kaushal',
    tags: ['Augmented Reality', 'Competition'],
  },
]

/** The page body: the facts on record, then an honest note about the rest. */
function content(project: SeedProject) {
  return [
    textBlock([
      heading('h2', [text('At a Glance')]),
      list('bullet', [
        [bold('Team: '), text(project.team)],
        [bold('Year: '), text(String(project.year))],
        [bold('Result: '), text(`${project.award} - ${project.event}`)],
      ]),
      heading('h2', [text('Write-Up')]),
      paragraph([
        italic(
          'The full write-up for this project has not been added yet - how it works, what it took, and what broke. The record above is what the department has on file. Photos, the build details, and links will go here.',
        ),
      ]),
    ]),
  ]
}

async function main() {
  const payload = await getPayload({ config })

  for (const project of PROJECTS) {
    const tags = await ensureTagIds(payload, project.tags)

    const data = {
      title: project.title,
      slug: project.slug,
      description: project.description,
      award: project.award,
      event: project.event,
      year: project.year,
      // Explicitly cleared: an earlier run attached the shared placeholder,
      // and a type-led tile is the intended look until real photos exist.
      thumbnail: null,
      tags,
      content: content(project),
    }

    const existing = await payload.find({
      collection: 'projects',
      where: { slug: { equals: project.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      const id = existing.docs[0].id
      await payload.update({ collection: 'projects', id, data, overrideAccess: true })
      console.log(`Updated existing project ${id} (${project.slug}).`)
    } else {
      const created = await payload.create({ collection: 'projects', data, overrideAccess: true })
      console.log(`Created project ${created.id} (${project.slug}).`)
    }
    console.log(`View at /projects/${project.slug}`)
  }
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
