/**
 * Seed the design, CAD, and slicer tools onto /simulators.
 *
 *   pnpm tsx scripts/seedSimulators.ts
 *
 * "Simulator" is loose here: the collection is the club's shelf of tools a
 * student can go and open, so a slicer or a CAD package belongs next to Wokwi.
 *
 * Matched on slug, so a re-run updates rather than duplicates. Thumbnails are
 * looked up by the media filename already uploaded through the admin; an entry
 * whose logo is missing is skipped with a warning rather than failing the run.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import { flushExit } from './lib/learningSeed'

interface SimulatorSeed {
  title: string
  slug: string
  description: string
  launchUrl: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** Filename stem of the logo already in the media collection. */
  logo: string
}

const SIMULATORS: SimulatorSeed[] = [
  {
    title: 'Tinkercad',
    slug: 'tinkercad',
    description:
      'Browser based 3D design and circuit simulation from Autodesk. Wire up an Arduino, write the code, and watch it run without owning a single part.',
    launchUrl: 'https://www.tinkercad.com',
    difficulty: 'beginner',
    logo: 'Logo-tinkercad-wordmark',
  },
  {
    title: 'KiCad',
    slug: 'kicad',
    description:
      'Open source EDA suite: schematic capture, PCB layout, and a 3D preview of the finished board. Where you go once a breadboard is no longer enough.',
    launchUrl: 'https://www.kicad.org',
    difficulty: 'intermediate',
    logo: 'KiCad-Logo.svg',
  },
  {
    title: 'Fusion 360',
    slug: 'fusion-360',
    description:
      'Autodesk CAD and CAM, free on an education licence. Parametric modelling for enclosures, brackets, and anything headed for a printer or a mill.',
    launchUrl: 'https://www.autodesk.com/products/fusion-360',
    difficulty: 'intermediate',
    logo: 'Fusion360_Logo',
  },
  {
    title: 'Blender',
    slug: 'blender',
    description:
      'Free and open source 3D suite for modelling, animation, and rendering. Good for enclosure design and for a proper render of a build before it exists.',
    launchUrl: 'https://www.blender.org',
    difficulty: 'advanced',
    logo: 'Blender_logo_no_text',
  },
  {
    title: 'Unity',
    slug: 'unity',
    description:
      'Real time 3D engine, free on the Personal plan. Games, simulations, AR and VR, and digital twins that talk back to real hardware.',
    launchUrl: 'https://unity.com',
    difficulty: 'advanced',
    logo: 'Unity-Logo',
  },
  {
    title: 'Orca Slicer',
    slug: 'orca-slicer',
    description:
      'Open source slicer for FDM printers, forked from Bambu Studio. Turns an STL into printer instructions with fine control over quality and supports.',
    launchUrl: 'https://github.com/SoftFever/OrcaSlicer',
    difficulty: 'beginner',
    logo: 'ZMZyLipCdogu',
  },
  {
    title: 'Ultimaker Cura',
    slug: 'ultimaker-cura',
    description:
      'Free and widely used slicer for FDM printers. Sensible profiles out of the box, so a first print succeeds without tuning fifty settings first.',
    launchUrl: 'https://ultimaker.com/software/ultimaker-cura',
    difficulty: 'beginner',
    logo: 'com.ultimaker.cura.desktop',
  },
]

async function findLogo(payload: Payload, stem: string): Promise<number | null> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { like: stem } },
    limit: 1,
    overrideAccess: true,
  })
  return docs.length > 0 ? (docs[0].id as number) : null
}

async function run() {
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0
  let skipped = 0

  for (const sim of SIMULATORS) {
    const thumbnail = await findLogo(payload, sim.logo)
    if (!thumbnail) {
      console.warn(`skipped ${sim.title}: no media matching "${sim.logo}"`)
      skipped++
      continue
    }

    const data = {
      title: sim.title,
      slug: sim.slug,
      description: sim.description,
      launchUrl: sim.launchUrl,
      difficulty: sim.difficulty,
      thumbnail,
    }

    const existing = await payload.find({
      collection: 'simulators',
      where: { slug: { equals: sim.slug } },
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
      updated++
    } else {
      await payload.create({ collection: 'simulators', data, overrideAccess: true })
      created++
    }
  }

  console.log(`Simulators seeded. created: ${created}, updated: ${updated}, skipped: ${skipped}`)
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
