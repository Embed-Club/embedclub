/**
 * Fill in the rest of the simulator fields: tags, setup time, and the three
 * AI tools that were missing. Adds any tag it needs to the Tags collection.
 *
 *   pnpm tsx scripts/seedSimulatorMetadata.ts
 *
 * `estimatedTime` on a simulator is read as "minutes before you are actually
 * using it": a browser tool with no account is a minute, one with a login is
 * five, and a multi-gigabyte install is half an hour.
 *
 * Matched on slug, so a re-run updates. Walkthrough videos are handled by
 * seedSimulatorVideos.ts, which only writes URLs it has verified.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import sharp from 'sharp'
import {
  ensurePlaceholderMedia,
  flushExit,
  list,
  paragraph,
  text,
  textBlock,
} from './lib/learningSeed'

/** Everything the simulator cards can be tagged with, created if missing. */
const TAG_NAMES = [
  'Arduino',
  'Automation',
  'Browser Based',
  'CAD',
  'Competition',
  'Computer Vision',
  'Data Science',
  'Emulator',
  'ESP32',
  'Game Engine',
  'IDE',
  'IoT',
  'Machine Learning',
  'Microcontroller',
  'Open Source',
  'PCB Design',
  'Python',
  'Raspberry',
  'Simulation',
  '3D Printing',
]

interface Meta {
  /** Minutes from clicking the link to having the tool usable. */
  estimatedTime: number
  tags: string[]
}

const META: Record<string, Meta> = {
  wokwi: {
    estimatedTime: 2,
    tags: ['Browser Based', 'Simulation', 'Microcontroller', 'Arduino', 'ESP32'],
  },
  'arduino-ide': { estimatedTime: 10, tags: ['Open Source', 'IDE', 'Microcontroller', 'Arduino'] },
  tinkercad: { estimatedTime: 5, tags: ['Browser Based', 'Simulation', 'CAD', 'Arduino'] },
  kicad: { estimatedTime: 15, tags: ['Open Source', 'PCB Design'] },
  'fusion-360': { estimatedTime: 30, tags: ['CAD', '3D Printing'] },
  blender: { estimatedTime: 15, tags: ['Open Source', 'CAD'] },
  unity: { estimatedTime: 30, tags: ['Game Engine', 'Simulation'] },
  'orca-slicer': { estimatedTime: 10, tags: ['Open Source', '3D Printing'] },
  'ultimaker-cura': { estimatedTime: 10, tags: ['Open Source', '3D Printing'] },
  'falstad-circuit-simulator': { estimatedTime: 1, tags: ['Browser Based', 'Simulation'] },
  simulide: { estimatedTime: 10, tags: ['Open Source', 'Simulation', 'Microcontroller'] },
  easyeda: { estimatedTime: 5, tags: ['Browser Based', 'PCB Design'] },
  fritzing: { estimatedTime: 10, tags: ['Open Source', 'PCB Design', 'Arduino'] },
  ltspice: { estimatedTime: 10, tags: ['Simulation'] },
  freecad: { estimatedTime: 15, tags: ['Open Source', 'CAD', '3D Printing'] },
  openscad: { estimatedTime: 10, tags: ['Open Source', 'CAD', '3D Printing'] },
  prusaslicer: { estimatedTime: 10, tags: ['Open Source', '3D Printing'] },
  platformio: { estimatedTime: 15, tags: ['Open Source', 'IDE', 'Microcontroller', 'ESP32'] },
  thonny: {
    estimatedTime: 10,
    tags: ['Open Source', 'IDE', 'Python', 'Microcontroller', 'Raspberry'],
  },
  renode: { estimatedTime: 15, tags: ['Open Source', 'Emulator', 'Microcontroller'] },
  qemu: { estimatedTime: 15, tags: ['Open Source', 'Emulator'] },
  'node-red': { estimatedTime: 15, tags: ['Open Source', 'IoT', 'Automation', 'Browser Based'] },
  'home-assistant': {
    estimatedTime: 30,
    tags: ['Open Source', 'IoT', 'Automation', 'Raspberry', 'ESP32'],
  },
  'visual-studio-code': { estimatedTime: 10, tags: ['Open Source', 'IDE'] },
  'google-colab': {
    estimatedTime: 2,
    tags: ['Browser Based', 'Python', 'Machine Learning', 'Data Science'],
  },
  godot: { estimatedTime: 5, tags: ['Open Source', 'Game Engine', 'Simulation'] },
  // The three added here
  'google-antigravity': { estimatedTime: 15, tags: ['IDE', 'Machine Learning'] },
  kaggle: {
    estimatedTime: 5,
    tags: ['Browser Based', 'Machine Learning', 'Data Science', 'Python', 'Competition'],
  },
  roboflow: {
    estimatedTime: 5,
    tags: ['Browser Based', 'Computer Vision', 'Machine Learning'],
  },
}

interface NewTool {
  title: string
  slug: string
  description: string
  launchUrl: string
  launchType: 'website' | 'download'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: string | null
  intro?: string
  steps: string[]
}

const NEW_TOOLS: NewTool[] = [
  {
    title: 'Google Antigravity',
    slug: 'google-antigravity',
    description:
      'Google agentic development platform, built on an editor that plans and writes code for you. Free while it is in preview, and it runs Gemini models.',
    launchUrl: 'https://antigravity.google',
    launchType: 'download',
    difficulty: 'intermediate',
    icon: null,
    intro: 'Free in preview. Sign in with a Google account to get the model quota.',
    steps: [
      'Download the installer for your operating system from the site and run it.',
      'Sign in with your Google account when it opens.',
      'Open a project folder, then use the agent panel rather than typing every line yourself.',
      'Read what the agent proposes before accepting it. It edits real files on disk.',
    ],
  },
  {
    title: 'Kaggle',
    slug: 'kaggle',
    description:
      'Datasets, free GPU notebooks, and machine learning competitions. The fastest way to get real data and a working baseline model in front of you.',
    launchUrl: 'https://www.kaggle.com',
    launchType: 'website',
    difficulty: 'beginner',
    intro: 'Free account. Verify your phone number to unlock GPU time and internet in notebooks.',
    icon: 'kaggle',
    steps: [
      'Create an account and verify your phone number, which unlocks the GPU quota.',
      'Search Datasets for something in your problem area, then click New Notebook on it.',
      'Turn on the accelerator under the notebook settings if you are training anything.',
      'Enter a competition when you want a scoreboard. The public notebooks there are the real lesson.',
    ],
  },
  {
    title: 'Roboflow',
    slug: 'roboflow',
    description:
      'Computer vision pipeline in the browser: label images, augment the dataset, train a detection model, and export it for a Pi or an ESP32-CAM.',
    launchUrl: 'https://roboflow.com',
    launchType: 'website',
    difficulty: 'intermediate',
    intro:
      'Free tier covers a student project. Public projects get more credits than private ones.',
    icon: 'roboflow',
    steps: [
      'Create a free account and start a project, choosing object detection or classification.',
      'Upload your images and draw boxes around the objects you care about.',
      'Generate a dataset version, adding augmentations to stretch a small set further.',
      'Train in the browser, then export the weights or call the hosted API from your board.',
    ],
  },
]

async function ensureTags(payload: Payload): Promise<Map<string, number>> {
  const byName = new Map<string, number>()

  for (const name of TAG_NAMES) {
    const found = await payload.find({
      collection: 'tags',
      where: { name: { equals: name } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs.length > 0) {
      byName.set(name, found.docs[0].id as number)
      continue
    }
    const created = await payload.create({
      collection: 'tags',
      data: {
        name,
        slug: name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-'),
      },
      overrideAccess: true,
    })
    byName.set(name, created.id as number)
    console.log(`tag created: ${name}`)
  }

  return byName
}

async function fetchIcon(slug: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://cdn.simpleicons.org/${slug}`, {
      headers: { 'User-Agent': 'EmbedClubSiteSeed/1.0' },
    })
    if (!res.ok) return null
    const svg = Buffer.from(await res.arrayBuffer())
    if (svg.byteLength < 100) return null
    return await sharp(svg, { density: 384 })
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  } catch {
    return null
  }
}

async function ensureIcon(payload: Payload, tool: NewTool): Promise<number> {
  const webpName = `${tool.slug}Logo.webp`
  const found = await payload.find({
    collection: 'media',
    where: { filename: { equals: webpName } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs.length > 0) return found.docs[0].id as number

  const png = tool.icon ? await fetchIcon(tool.icon) : null
  if (!png) return await ensurePlaceholderMedia(payload)

  const media = await payload.create({
    collection: 'media',
    data: { alt: `${tool.title} logo` },
    file: {
      data: png,
      name: `${tool.slug}Logo.png`,
      mimetype: 'image/png',
      size: png.byteLength,
    },
    overrideAccess: true,
  })
  return media.id as number
}

async function run() {
  const payload = await getPayload({ config })
  const tagIds = await ensureTags(payload)

  // 1. The three new tools
  for (const tool of NEW_TOOLS) {
    const thumbnail = await ensureIcon(payload, tool)
    const children = []
    if (tool.intro) children.push(paragraph([text(tool.intro)]))
    children.push(
      list(
        'number',
        tool.steps.map((step) => [text(step)]),
      ),
    )

    const data = {
      title: tool.title,
      slug: tool.slug,
      description: tool.description,
      launchUrl: tool.launchUrl,
      launchType: tool.launchType,
      difficulty: tool.difficulty,
      thumbnail,
      content: [textBlock(children)],
    }

    const existing = await payload.find({
      collection: 'simulators',
      where: { slug: { equals: tool.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'simulators',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
    } else {
      await payload.create({ collection: 'simulators', data, overrideAccess: true })
    }
    console.log(`tool ready: ${tool.title}`)
  }

  // 2. Tags and setup time across every simulator
  let filled = 0
  const unknown: string[] = []

  for (const [slug, meta] of Object.entries(META)) {
    const found = await payload.find({
      collection: 'simulators',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs.length === 0) {
      unknown.push(slug)
      continue
    }

    await payload.update({
      collection: 'simulators',
      id: found.docs[0].id,
      data: {
        estimatedTime: meta.estimatedTime,
        tags: meta.tags.map((name) => tagIds.get(name)).filter((id): id is number => Boolean(id)),
      },
      overrideAccess: true,
    })
    filled++
  }

  console.log(`\nMetadata filled on ${filled} simulators.`)
  if (unknown.length > 0) console.log(`No simulator for slug: ${unknown.join(', ')}`)
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
