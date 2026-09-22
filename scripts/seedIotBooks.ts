/**
 * Seed the IoT book library shared by Habeeb Sir (Drive folder "IoT Books")
 * as linked resources. Each book becomes one resource that embeds the Drive
 * PDF viewer, with the cover art uploaded as its thumbnail.
 *
 *   IOT_BOOK_COVERS=<dir> pnpm tsx scripts/seedIotBooks.ts
 *
 * `<dir>` holds `<driveFileId>.png` cover images. Re-running updates existing
 * rows by slug instead of duplicating them.
 */
import 'dotenv/config'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { generateSlug } from '@/payload/collections/learningFields'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'
import { flushExit } from './lib/learningSeed'

interface Book {
  driveId: string
  title: string
  authors: string
  publisher: string
  year: number
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const BOOKS: Book[] = [
  {
    driveId: '1vtz8hkYK4xJb49MilXu7CCewyQgmGR_f',
    title: 'Internet of Things: A Hands-On Approach',
    authors: 'Arshdeep Bahga, Vijay Madisetti',
    publisher: 'Universities Press',
    year: 2015,
    description:
      'The standard IoT textbook for Indian universities - levels, domains, Raspberry Pi, Python and case studies.',
    difficulty: 'beginner',
  },
  {
    driveId: '1cbNgFXL76mJMn7j-mkDHyhJxJOtIJqf_',
    title: 'From Machine-to-Machine to the Internet of Things',
    authors: 'Jan Holler, Vlasios Tsiatsis, Catherine Mulligan et al.',
    publisher: 'Academic Press',
    year: 2014,
    description:
      'How M2M grew into the IoT - architecture, standards, and the business drivers behind connected systems.',
    difficulty: 'beginner',
  },
  {
    driveId: '1c-ax1fnuSvk4nP4TsUi0pVQ4ANkIawxT',
    title: 'Fundamentals of IoT Communication Technologies',
    authors: 'Rolando Herrero',
    publisher: 'Springer',
    year: 2021,
    description:
      'Protocol-by-protocol tour of how IoT devices talk - physical layer to application layer, with worked examples.',
    difficulty: 'intermediate',
  },
  {
    driveId: '1k-8hzZGCD6w8RMXVokbOFEjI92IXyjdB',
    title: 'Internet of Things for Architects',
    authors: 'Perry Lea',
    publisher: 'Packt',
    year: 2018,
    description:
      'Sensors, communication infrastructure, edge computing, analytics and security - the full IoT stack for system designers.',
    difficulty: 'intermediate',
  },
  {
    driveId: '1ck8-O_zC6QBp7r-c5HbisulJZT9cRjM-',
    title: 'IoT and Edge Computing for Architects, 2nd Edition',
    authors: 'Perry Lea',
    publisher: 'Packt',
    year: 2020,
    description:
      'Updated edition covering edge and fog computing, 5G, LoRaWAN and security for sensor-to-cloud systems.',
    difficulty: 'intermediate',
  },
  {
    driveId: '19sLC8yNAff6-Ou2WLSaZAOXhGyuRj2uB',
    title: 'Architecting the Internet of Things',
    authors: 'Dieter Uckelmann, Mark Harrison, Florian Michahelles (eds.)',
    publisher: 'Springer',
    year: 2011,
    description:
      'Research collection on IoT architecture - RFID, EPCglobal, discovery services and the early web of things.',
    difficulty: 'advanced',
  },
  {
    driveId: '1GoVSWEA4COOiaEaOVqNfvGLU5WHNyUjf',
    title: 'The Internet of Things in the Cloud: A Middleware Perspective',
    authors: 'Honbo Zhou',
    publisher: 'CRC Press',
    year: 2012,
    description:
      'Middleware, cloud platforms and service-oriented design for large-scale IoT deployments.',
    difficulty: 'advanced',
  },
  {
    driveId: '13pWltt2petK30-ziM8wYMythImsJR_RW',
    title: "The IoT Architect's Guide to Attainable Security and Privacy",
    authors: 'Damilare D. Fagbemi, David M. Wheeler, JC Wheeler',
    publisher: 'Auerbach Publications',
    year: 2019,
    description:
      'Practical security and privacy for IoT systems - threat modelling, identity, data protection and secure design.',
    difficulty: 'intermediate',
  },
  {
    driveId: '1WMXiKD_DxLuXPbvQVqzlZNHnzLpyKmvN',
    title: 'Microservices, IoT, and Azure',
    authors: 'Bob Familiar',
    publisher: 'Apress',
    year: 2015,
    description:
      'Building SaaS IoT solutions on Azure with DevOps and microservice architecture, with a full reference implementation.',
    difficulty: 'intermediate',
  },
  {
    driveId: '1c3ZAsMWJFG6IwtIwmU-NWaC14qEAxD3n',
    title: 'Azure IoT Development Cookbook',
    authors: 'Yatish Patil',
    publisher: 'Packt',
    year: 2017,
    description:
      'Recipe-style guide to Azure IoT Hub, device provisioning, stream analytics and building end-to-end IoT solutions.',
    difficulty: 'intermediate',
  },
]

async function main() {
  const coversDir = process.env.IOT_BOOK_COVERS
  if (!coversDir || !existsSync(coversDir)) {
    throw new Error('Set IOT_BOOK_COVERS to a directory of <driveFileId>.png cover images')
  }

  const payload = await getPayload({ config })

  // One shared tag so the Resources page filter groups the whole library.
  let tag = (
    await payload.find({ collection: 'tags', where: { slug: { equals: 'iot' } }, limit: 1 })
  ).docs[0]
  if (!tag) {
    tag = await payload.create({ collection: 'tags', data: { name: 'IoT', slug: 'iot' } })
    payload.logger.info('created tag IoT')
  }

  for (const book of BOOKS) {
    const slug = generateSlug(book.title)
    const coverPath = path.join(coversDir, `${book.driveId}.png`)
    if (!existsSync(coverPath)) throw new Error(`missing cover ${coverPath}`)

    const cover = await payload.create({
      collection: 'media',
      data: { alt: `Cover of ${book.title}` },
      filePath: coverPath,
    })

    const data = {
      title: book.title,
      slug,
      description: book.description,
      thumbnail: cover.id,
      source: 'link' as const,
      externalUrl: `https://drive.google.com/file/d/${book.driveId}/view`,
      difficulty: book.difficulty,
      tags: [tag.id],
      badge: 'essential' as const,
    }

    const existing = await payload.find({
      collection: 'resources',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs[0]) {
      await payload.update({ collection: 'resources', id: existing.docs[0].id, data })
      payload.logger.info(`updated ${slug}`)
    } else {
      await payload.create({ collection: 'resources', data })
      payload.logger.info(`created ${slug}`)
    }
  }
}

main()
  .then(() => flushExit(0))
  .catch((error) => {
    console.error(error)
    flushExit(1)
  })
