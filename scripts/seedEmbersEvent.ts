/**
 * Seed the "Embers '26" event so it shows on the Events page.
 *
 *   pnpm tsx scripts/seedEmbersEvent.ts
 *
 * Matched on slug, so re-running updates the event in place. The description
 * links to the Embers page (/embers), the rulebook and the registration form -
 * the Events collection has no field for a "go to this page" button, so the
 * links live in the rich text. Add the poster in the admin (Events > Embers '26
 * > Event Poster/Image) once the file is to hand.
 */
import 'dotenv/config'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'
import { bold, flushExit, heading, link, paragraph, richText, text } from './lib/learningSeed'

const SLUG = 'embers-26'
const EMBERS_PAGE = '/embers'
const RULEBOOK =
  'https://drive.google.com/file/d/1EuImfJXUIAwuKARnzIWVRqLsQvYX5FxL/view?usp=drivesdk'
const REGISTRATION = 'https://forms.gle/FydTB5VYcbqmsBbj6'

const description = richText([
  paragraph([
    text(
      'A National Level Technical Fest by the Department of Computer Science and Engineering in association with Embed Club.',
    ),
  ]),
  paragraph([
    bold('Ideas / Build / Innovate. '),
    text('A platform for brilliant minds to create real-world solutions.'),
  ]),
  heading('h3', [text("What's happening")]),
  paragraph([
    bold('Day 1 - AI Workshop and Embedthon. '),
    text(
      'Learn AI hands-on, then build an innovative project to solve real-world problems in our hackathon.',
    ),
  ]),
  paragraph([
    bold('Day 2 - Project Exhibition and Paper Presentation. '),
    text('Showcase your innovative projects and present your research ideas to the world.'),
  ]),
  paragraph([
    bold('Special note for 3rd years: '),
    text('showcase your Mini Project in the Project Exhibition.'),
  ]),
  paragraph([
    text('24th and 25th November 2026 at P.A. College of Engineering, Mangaluru. '),
    bold('Win exciting cash prizes.'),
  ]),
  paragraph([
    text('Go to the '),
    link([bold("Embers '26 page")], EMBERS_PAGE),
    text(' for the schedule and details, read the '),
    link([bold('rulebook')], RULEBOOK, { newTab: true }),
    text(', and '),
    link([bold('register here')], REGISTRATION, { newTab: true }),
    text('.'),
  ]),
  paragraph([text('Tag your team. Learn, Build, Present. Show the world what you can do.')]),
])

async function main() {
  const payload = await getPayload({ config })

  const data = {
    category: 'Tech Fest',
    title: "Embers '26",
    slug: SLUG,
    eventDate: '2026-11-24T09:00:00+05:30',
    eventMode: 'inPerson' as const,
    shortDescription:
      'National level technical fest: AI workshop, Embedthon, Project Expo and Paper Presentation. 24 and 25 November 2026, PACE Mangaluru.',
    description,
    location: { address: 'P.A. College of Engineering, Mangaluru' },
  }

  const existing = await payload.find({
    collection: 'events',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'events', id: existing.docs[0].id, data })
    console.log(`Updated event ${existing.docs[0].id} (${SLUG})`)
  } else {
    const created = await payload.create({ collection: 'events', data })
    console.log(`Created event ${created.id} (${SLUG})`)
  }
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
