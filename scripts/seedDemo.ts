/**
 * Fill an empty database with demo content.
 *
 *   pnpm seed:demo
 *
 * For anyone working on the site who is not working on the club's real data:
 * point DATABASE_URL at your own database, run the migrations, run this, and
 * every page has something on it.
 *
 * Two things it is built to do beyond "not be empty":
 *
 * - Cover the variants. Events are online and in person, past and upcoming.
 *   Resources are both written-here and linked-elsewhere. Simulators both
 *   open a site and send you to a download. A layout that has only ever seen
 *   one branch of a conditional field is a layout with an untested branch.
 * - Stress the layout. Titles that wrap three times sit next to two-word ones,
 *   a bio runs long enough to overflow a fixed card, one string is a single
 *   unbroken token, and the images come in shapes from ultra-wide to tall.
 *
 * Everything is invented and every image is drawn at seed time. No real
 * member, contact detail or photo ends up in a fork.
 *
 * Safe to re-run: documents are matched on slug (or filename for uploads) and
 * updated in place rather than duplicated.
 */
import 'dotenv/config'
import config from '@/payload/payload.config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { ensureDemoImage } from './demo/demoImages'
import {
  BIOS,
  DEMO_MEMBERS,
  LONG_TITLE,
  MAX_LENGTH_DESCRIPTION,
  PARAGRAPHS,
  SHORT_DESCRIPTION,
  SHORT_TITLE,
  UNBROKEN_TOKEN,
  UNICODE_SAMPLE,
} from './demo/demoText'
import {
  accordionBlock,
  accordionItem,
  bold,
  codeBlock,
  flushExit,
  heading,
  imageBlock,
  list,
  paragraph,
  richText,
  text,
  textBlock,
} from './lib/learningSeed'

/** Days from today, so the dataset always has genuinely past and future events. */
function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

/** Upsert by slug and return the id. */
async function upsert(
  payload: Payload,
  collection: Parameters<Payload['create']>[0]['collection'],
  slug: string,
  data: Record<string, unknown>,
): Promise<number> {
  const found = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (found.docs[0]) {
    const updated = await payload.update({
      collection,
      id: found.docs[0].id,
      data: data as never,
      overrideAccess: true,
    })
    return updated.id as number
  }

  const created = await payload.create({
    collection,
    data: { ...data, slug } as never,
    overrideAccess: true,
  })
  return created.id as number
}

async function main() {
  const payload = await getPayload({ config })
  const log = (message: string) => payload.logger.info(`[demo] ${message}`)

  // --- Taxonomy -----------------------------------------------------------
  const tagIds: Record<string, number> = {}
  for (const name of ['IoT', 'ESP32', 'Embedded Machine Learning', 'Power', 'Radio', 'micro:bit']) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    tagIds[name] = await upsert(payload, 'tags', slug, { name })
  }
  log(`tags: ${Object.keys(tagIds).length}`)

  const roleIds: Record<string, number> = {}
  for (const [index, name] of [
    'President',
    'Technical Lead',
    'Workshop Coordinator and Outreach Lead',
    'Member',
  ].entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    roleIds[name] = await upsert(payload, 'member-roles', slug, { name, sortOrder: index + 1 })
  }

  // Two categories with opposite batch ordering, so both branches render.
  const coreCategory = await upsert(payload, 'member-categories', 'core-team', {
    name: 'Core Team',
    description: 'Members running the club this year.',
    batchOrder: 'newestFirst',
    sortOrder: 1,
  })
  const alumniCategory = await upsert(payload, 'member-categories', 'alumni', {
    name: 'Alumni',
    description: UNICODE_SAMPLE,
    batchOrder: 'oldestFirst',
    sortOrder: 2,
  })
  log('member categories and roles')

  // --- Members ------------------------------------------------------------
  // Varied on purpose: one with no photo, one with no bio, one alumnus with an
  // end year, one name long enough to wrap, one that is a single word.
  const memberIds: number[] = []
  for (const [index, person] of DEMO_MEMBERS.entries()) {
    const isAlumnus = index >= 4
    const hasPhoto = index !== 1
    const slug = person.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const photo = hasPhoto
      ? await ensureDemoImage(
          payload,
          'member-photo',
          `member-${index}`,
          person.fullName.split(' ')[0],
          'square',
          index,
          `Demo portrait for ${person.fullName}`,
        )
      : undefined

    const bio = index === 0 ? BIOS.long : index === 2 ? BIOS.short : BIOS.none

    const found = await payload.find({
      collection: 'members',
      where: { fullName: { equals: person.fullName } },
      limit: 1,
      overrideAccess: true,
    })

    const data = {
      fullName: person.fullName,
      gender: index === 3 ? 'unspecified' : person.gender,
      category: isAlumnus ? alumniCategory : coreCategory,
      roles: [roleIds[index === 0 ? 'President' : index === 1 ? 'Technical Lead' : 'Member']],
      bio,
      startYear: isAlumnus ? 2018 : 2024,
      endYear: isAlumnus ? 2022 : undefined,
      ...(photo ? { photo } : {}),
      // Only some members have links, which is how it looks in practice.
      ...(index % 2 === 0 ? { github: `https://github.com/demo-${slug}` } : {}),
      ...(index === 0 ? { linkedin: `https://www.linkedin.com/in/demo-${slug}` } : {}),
    }

    if (found.docs[0]) {
      await payload.update({
        collection: 'members',
        id: found.docs[0].id,
        data: data as never,
        overrideAccess: true,
      })
      memberIds.push(found.docs[0].id as number)
    } else {
      const created = await payload.create({
        collection: 'members',
        data: data as never,
        overrideAccess: true,
      })
      memberIds.push(created.id as number)
    }
  }
  log(`members: ${memberIds.length}`)

  // --- Events -------------------------------------------------------------
  // Every combination that changes what renders: in person vs online, past vs
  // upcoming, with and without a venue, a short description and a long one.
  const events = [
    {
      slug: 'demo-soldering-clinic',
      category: 'Workshop',
      title: 'Soldering Clinic',
      eventDate: daysFromNow(14),
      eventMode: 'inPerson' as const,
      shortDescription: SHORT_DESCRIPTION,
      venue: { roomName: 'NT Lab', floor: '2nd floor' },
      location: { address: 'P.A. College of Engineering, Nadupadav, Mangalore' },
      shape: 'landscape' as const,
    },
    {
      slug: 'demo-firmware-office-hours',
      category: 'Open Session',
      title: LONG_TITLE,
      eventDate: daysFromNow(30),
      eventMode: 'online' as const,
      meetingLink: 'https://meet.google.com/demo-abc-defg',
      shortDescription: MAX_LENGTH_DESCRIPTION,
      shape: 'ultrawide' as const,
    },
    {
      slug: 'demo-pi-day',
      category: 'Social',
      title: SHORT_TITLE,
      eventDate: daysFromNow(-45),
      eventMode: 'inPerson' as const,
      venue: { roomName: 'Seminar Hall' },
      location: { address: 'Mangalore, Karnataka' },
      shape: 'portrait' as const,
    },
    {
      slug: 'demo-radio-teardown',
      category: 'Teardown',
      title: `Teardown Night: ${UNBROKEN_TOKEN}`,
      eventDate: daysFromNow(-7),
      eventMode: 'online' as const,
      meetingLink: 'https://meet.google.com/demo-hij-klmn',
      // No shortDescription: the card has to cope without one.
      shape: 'tiny' as const,
    },
  ]

  for (const [index, event] of events.entries()) {
    const image = await ensureDemoImage(
      payload,
      'media',
      `event-${index}`,
      event.category,
      event.shape,
      index + 2,
      `Demo poster for ${event.title}`,
    )

    await upsert(payload, 'events', event.slug, {
      category: event.category,
      title: event.title,
      eventDate: event.eventDate,
      eventMode: event.eventMode,
      ...(event.meetingLink ? { meetingLink: event.meetingLink } : {}),
      ...(event.shortDescription ? { shortDescription: event.shortDescription } : {}),
      ...(event.venue ? { venue: event.venue } : {}),
      ...(event.location ? { location: event.location } : {}),
      image,
      description: richText([
        paragraph([text(PARAGRAPHS[0])]),
        paragraph([text(index === 1 ? PARAGRAPHS[1] : PARAGRAPHS[2])]),
      ]),
    })
  }
  log(`events: ${events.length}`)

  // --- Resources and tutorials -------------------------------------------
  // Both source branches: a written body with every block type, and the four
  // kinds of link the embed resolver knows about.
  const bodyImage = await ensureDemoImage(
    payload,
    'media',
    'body-diagram',
    'Diagram',
    'landscape',
    5,
    'Demo diagram inside a written resource',
  )

  const writtenBody = [
    textBlock([
      heading('h2', [text('What this is')]),
      paragraph([text(PARAGRAPHS[0])]),
      paragraph([bold('A long section follows. '), text(PARAGRAPHS[1])]),
      heading('h2', [text('Steps')]),
      list('number', [[text('Plug the board in.')], [text('Flash it.')], [text('Watch it fail.')]]),
    ]),
    codeBlock(
      'python',
      'from microbit import *\n\ndisplay.scroll("demo")\n',
      'A very short program',
    ),
    imageBlock(bodyImage, 'A diagram that is wider than the reading column'),
    accordionBlock(
      [
        accordionItem('It does nothing when I plug it in', [
          paragraph([text('Try a different cable. Half of them are charge-only.')]),
        ]),
        accordionItem(UNBROKEN_TOKEN, [paragraph([text(PARAGRAPHS[2])])]),
      ],
      'Troubleshooting',
    ),
  ]

  const learning = [
    {
      collection: 'resources' as const,
      slug: 'demo-written-resource',
      title: 'Reading Sensors Without Blocking the Main Loop',
      description: MAX_LENGTH_DESCRIPTION,
      difficulty: 'intermediate',
      badge: 'featured',
      source: 'manual',
      content: writtenBody,
      tags: [tagIds.IoT, tagIds.ESP32],
      estimatedReadTime: 12,
      shape: 'landscape' as const,
    },
    {
      collection: 'resources' as const,
      slug: 'demo-linked-video',
      title: SHORT_TITLE,
      description: SHORT_DESCRIPTION,
      difficulty: 'beginner',
      source: 'link',
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags: [],
      shape: 'square' as const,
    },
    {
      collection: 'resources' as const,
      slug: 'demo-linked-website',
      title: `Datasheet: ${UNBROKEN_TOKEN}`,
      description: 'A linked website, which may or may not agree to be framed.',
      difficulty: 'advanced',
      badge: 'comingSoon',
      source: 'link',
      externalUrl: 'https://example.com/',
      tags: [tagIds.Radio],
      shape: 'tiny' as const,
    },
    {
      collection: 'tutorials' as const,
      slug: 'demo-written-tutorial',
      title: LONG_TITLE,
      description: MAX_LENGTH_DESCRIPTION,
      difficulty: 'beginner',
      badge: 'essential',
      source: 'manual',
      content: writtenBody,
      tags: [tagIds['micro:bit'], tagIds['Embedded Machine Learning']],
      estimatedReadTime: 45,
      shape: 'ultrawide' as const,
    },
    {
      collection: 'tutorials' as const,
      slug: 'demo-linked-pdf',
      title: 'Course Handout',
      description: 'A linked PDF, rendered in the browser viewer.',
      difficulty: 'intermediate',
      source: 'link',
      externalUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      tags: [tagIds.Power],
      shape: 'portrait' as const,
    },
  ]

  for (const [index, doc] of learning.entries()) {
    const thumbnail = await ensureDemoImage(
      payload,
      'media',
      `learning-${index}`,
      doc.collection === 'resources' ? 'Resource' : 'Tutorial',
      doc.shape,
      index + 1,
      `Demo thumbnail for ${doc.title}`,
    )

    await upsert(payload, doc.collection, doc.slug, {
      title: doc.title,
      description: doc.description,
      thumbnail,
      difficulty: doc.difficulty,
      source: doc.source,
      ...(doc.externalUrl ? { externalUrl: doc.externalUrl } : {}),
      ...(doc.content ? { content: doc.content } : {}),
      ...(doc.badge ? { badge: doc.badge } : {}),
      ...(doc.estimatedReadTime ? { estimatedReadTime: doc.estimatedReadTime } : {}),
      tags: doc.tags,
    })
  }
  log(`resources and tutorials: ${learning.length}`)

  // --- Simulators ---------------------------------------------------------
  const simulators = [
    {
      slug: 'demo-browser-simulator',
      title: 'Browser Circuit Simulator',
      description: MAX_LENGTH_DESCRIPTION,
      launchType: 'website',
      launchUrl: 'https://wokwi.com',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      difficulty: 'beginner',
      estimatedTime: 20,
      shape: 'landscape' as const,
    },
    {
      slug: 'demo-desktop-simulator',
      title: SHORT_TITLE,
      description: SHORT_DESCRIPTION,
      launchType: 'download',
      launchUrl: 'https://example.com/download',
      difficulty: 'advanced',
      shape: 'square' as const,
    },
  ]

  for (const [index, sim] of simulators.entries()) {
    const thumbnail = await ensureDemoImage(
      payload,
      'media',
      `simulator-${index}`,
      'Simulator',
      sim.shape,
      index + 3,
      `Demo thumbnail for ${sim.title}`,
    )
    await upsert(payload, 'simulators', sim.slug, {
      title: sim.title,
      description: sim.description,
      thumbnail,
      launchType: sim.launchType,
      launchUrl: sim.launchUrl,
      difficulty: sim.difficulty,
      ...(sim.videoUrl ? { videoUrl: sim.videoUrl } : {}),
      ...(sim.estimatedTime ? { estimatedTime: sim.estimatedTime } : {}),
      tags: [tagIds.IoT],
    })
  }
  log(`simulators: ${simulators.length}`)

  // --- Projects -----------------------------------------------------------
  const projects = [
    {
      slug: 'demo-monsoon-node',
      title: LONG_TITLE,
      description: MAX_LENGTH_DESCRIPTION,
      award: 'First Place',
      event: 'State Level Project Expo',
      year: 2026,
      team: memberIds.slice(0, 3),
      repoUrl: 'https://github.com/demo/monsoon-node',
      demoUrl: 'https://example.com/demo',
      shape: 'landscape' as const,
    },
    {
      slug: 'demo-badge',
      title: 'Conference Badge',
      description: SHORT_DESCRIPTION,
      // No award, no links, no team - the sparse case.
      shape: 'portrait' as const,
    },
  ]

  for (const [index, project] of projects.entries()) {
    const thumbnail = await ensureDemoImage(
      payload,
      'media',
      `project-${index}`,
      'Project',
      project.shape,
      index + 4,
      `Demo thumbnail for ${project.title}`,
    )
    await upsert(payload, 'projects', project.slug, {
      title: project.title,
      description: project.description,
      thumbnail,
      ...(project.award ? { award: project.award } : {}),
      ...(project.event ? { event: project.event } : {}),
      ...(project.year ? { year: project.year } : {}),
      ...(project.team ? { team: project.team } : {}),
      ...(project.repoUrl ? { repoUrl: project.repoUrl } : {}),
      ...(project.demoUrl ? { demoUrl: project.demoUrl } : {}),
      tags: [tagIds.ESP32],
    })
  }
  log(`projects: ${projects.length}`)

  // --- Achievements -------------------------------------------------------
  const achievements = [
    { title: 'Won the state project expo', date: daysFromNow(-120), withImage: true },
    { title: LONG_TITLE, date: daysFromNow(-400), withImage: true },
    { title: SHORT_TITLE, date: daysFromNow(-900), withImage: false },
  ]

  for (const [index, achievement] of achievements.entries()) {
    const image = achievement.withImage
      ? await ensureDemoImage(
          payload,
          'media',
          `achievement-${index}`,
          'Achievement',
          index === 0 ? 'landscape' : 'ultrawide',
          index + 5,
          `Demo image for ${achievement.title}`,
        )
      : undefined

    const found = await payload.find({
      collection: 'achievements',
      where: { title: { equals: achievement.title } },
      limit: 1,
      overrideAccess: true,
    })
    const data = {
      title: achievement.title,
      date: achievement.date,
      summary: richText([paragraph([text(index === 1 ? PARAGRAPHS[1] : PARAGRAPHS[0])])]),
      ...(image ? { image } : {}),
    }

    if (found.docs[0]) {
      await payload.update({
        collection: 'achievements',
        id: found.docs[0].id,
        data: data as never,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'achievements',
        data: data as never,
        overrideAccess: true,
      })
    }
  }
  log(`achievements: ${achievements.length}`)

  // --- Gallery ------------------------------------------------------------
  // Mixed shapes so the masonry and the marquee both get something awkward.
  const gallery: { key: string; shape: Parameters<typeof ensureDemoImage>[4]; caption?: string }[] =
    [
      { key: 'gallery-0', shape: 'landscape', caption: 'Workshop in the NT lab' },
      { key: 'gallery-1', shape: 'portrait', caption: UNICODE_SAMPLE },
      { key: 'gallery-2', shape: 'square' },
      { key: 'gallery-3', shape: 'ultrawide', caption: MAX_LENGTH_DESCRIPTION },
      { key: 'gallery-4', shape: 'tiny', caption: 'Small source image' },
      { key: 'gallery-5', shape: 'landscape' },
    ]

  for (const [index, photo] of gallery.entries()) {
    await ensureDemoImage(
      payload,
      'gallery',
      photo.key,
      'Gallery',
      photo.shape,
      index,
      photo.caption ?? '',
    )
  }
  log(`gallery: ${gallery.length}`)

  // --- Globals ------------------------------------------------------------
  await payload.updateGlobal({
    slug: 'achievement-settings',
    data: { sortOrder: 'desc' },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'home-featured-members',
    data: {
      rows: [
        { category: coreCategory, members: memberIds.slice(0, 3) },
        { category: alumniCategory, members: memberIds.slice(4) },
      ],
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      title: 'About',
      content: richText([
        paragraph([text(PARAGRAPHS[0])]),
        heading('h2', [text('How the club works')]),
        paragraph([text(PARAGRAPHS[1])]),
      ]),
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'support-pages',
    data: {
      contactTitle: 'Contact',
      contactEmail: 'demo@example.com',
      contactPhone: '+91 00000 00000',
      contact: richText([paragraph([text(PARAGRAPHS[0])])]),
      supportFaq: [
        {
          question: 'What is this site?',
          answer: richText([paragraph([text(PARAGRAPHS[0])])]),
        },
        {
          question: `A question long enough to wrap in the accordion header, about ${UNBROKEN_TOKEN}`,
          answer: richText([paragraph([text(PARAGRAPHS[1])])]),
        },
      ],
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'legal-pages',
    data: {
      privacyTitle: 'Privacy',
      privacy: richText([paragraph([text(PARAGRAPHS[0])])]),
      termsTitle: 'Terms',
      terms: richText([paragraph([text(PARAGRAPHS[2])])]),
      lastUpdated: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  log('globals')

  // --- Build targets ------------------------------------------------------
  const microbitThumb = await ensureDemoImage(
    payload,
    'media',
    'build-microbit',
    'micro:bit',
    'landscape',
    6,
    'Demo thumbnail for the micro:bit build target',
  )
  await upsert(payload, 'build-targets', 'microbit', {
    title: 'micro:bit',
    description:
      'Drag blocks or write MicroPython, then flash it straight to the board over USB - no install, nothing to download.',
    thumbnail: microbitThumb,
    editor: 'microbitPython',
    difficulty: 'beginner',
    tags: [tagIds['micro:bit']],
    notes: richText([
      paragraph([text('Plug the board in with a data USB cable, then press Flash.')]),
    ]),
  })
  log('build targets: 1')

  log('done - start the dev server and every page has something on it')
}

main()
  .then(() => flushExit(0))
  .catch((error) => {
    console.error(error)
    flushExit(1)
  })
