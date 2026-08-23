/**
 * Update the goals section of the About Page without replacing other CMS
 * content.
 *
 *   pnpm dlx tsx scripts/seedAboutPage.ts
 *
 * The current About global is read first, so edits made elsewhere in the page
 * remain intact when this seed is run.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import { flushExit, paragraph, richText, text } from './lib/learningSeed'

const GOALS_HEADING = 'LEARN. BUILD. PARTICIPATE. DISCOVER.'

const GOALS_DESCRIPTION = richText([
  paragraph([
    text(
      'Members are encouraged to learn the fundamentals, build real projects, and participate actively in workshops, competitions, and club activities. New members can work with teams, share what they learn, contribute to ongoing initiatives, and gain practical experience by taking part in the work of the club.',
    ),
  ]),
  paragraph([
    text(
      'Through this process, students discover technologies, ideas, and opportunities beyond the classroom. The goal is to create an environment where members can experiment, collaborate, fail, improve, and share what they discover with the wider club community.',
    ),
  ]),
])

async function run() {
  const payload = await getPayload({ config })
  const current = await payload.findGlobal({ slug: 'about-page', depth: 0 })
  const sections = [...(current.sections ?? [])]
  const goalsIndex = sections.findIndex(
    (section) => section.blockType === 'bannerBlock' && section.blockName === 'GOALS',
  )

  if (goalsIndex < 0) {
    throw new Error('Could not find the About Page section named "GOALS".')
  }

  const descriptionIndex = sections.findIndex(
    (section, index) => index > goalsIndex && section.blockType === 'aboutTextBlock',
  )

  if (descriptionIndex < 0) {
    throw new Error('Could not find the description following the goals banner.')
  }

  const goals = sections[goalsIndex]
  const description = sections[descriptionIndex]

  if (goals.blockType !== 'bannerBlock' || description.blockType !== 'aboutTextBlock') {
    throw new Error('The About Page goals sections have an unexpected shape.')
  }

  sections[goalsIndex] = {
    ...goals,
    heading: GOALS_HEADING,
    subheading: null,
  }
  sections[descriptionIndex] = {
    ...description,
    text: GOALS_DESCRIPTION,
  }

  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      title: current.title,
      content: current.content,
      sections,
    },
  })

  console.log(`Updated the About Page goals section to "${GOALS_HEADING}".`)
  flushExit(0)
}

run().catch((error) => {
  console.error(error)
  flushExit(1)
})
