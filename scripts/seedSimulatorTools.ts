/**
 * Seed the wider tool shelf onto /simulators: circuit simulators, EDA, CAD,
 * slicers, firmware toolchains, emulators, and the IoT platforms.
 *
 *   pnpm tsx scripts/seedSimulatorTools.ts
 *
 * Companion to seedSimulators.ts, which covers the tools whose logos were
 * already uploaded by hand. Here the logo is fetched from simple-icons (the
 * brand mark, in the brand colour) and rasterised with sharp, because Payload
 * stores images and sharp is already in the tree for the media pipeline.
 *
 * A tool with no simple-icons slug still gets seeded, using the shared
 * placeholder, and is listed at the end so its logo can be dropped in by hand.
 * Matched on slug, so re-runs update rather than duplicate.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { ensurePlaceholderMedia, flushExit } from './lib/learningSeed'

interface ToolSeed {
  title: string
  slug: string
  description: string
  launchUrl: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** simple-icons slug. Null when the project has no brand mark there. */
  icon: string | null
  /** Direct logo URL, for projects simple-icons does not carry. Tried first. */
  logoUrl?: string
}

const TOOLS: ToolSeed[] = [
  // Browser based circuit simulation
  {
    title: 'Falstad Circuit Simulator',
    slug: 'falstad-circuit-simulator',
    description:
      'Animated circuit simulator that runs in the browser. Current flows as coloured dots, so a divider or an RC curve stops being algebra and starts being visible.',
    launchUrl: 'https://www.falstad.com/circuit/',
    difficulty: 'beginner',
    icon: null,
  },
  {
    title: 'SimulIDE',
    slug: 'simulide',
    description:
      'Real time electronics simulator with microcontrollers built in. Drop in an AVR or a PIC, load your firmware, and watch the circuit respond to it.',
    launchUrl: 'https://simulide.com',
    difficulty: 'intermediate',
    icon: null,
  },
  // Schematic capture, PCB, SPICE
  {
    title: 'EasyEDA',
    slug: 'easyeda',
    description:
      'Schematic capture and PCB layout in the browser, with a parts library wired to LCSC. Nothing to install, and the board can go straight to fabrication.',
    launchUrl: 'https://easyeda.com',
    difficulty: 'beginner',
    icon: 'easyeda',
  },
  {
    title: 'Fritzing',
    slug: 'fritzing',
    description:
      'Draws the breadboard view everyone recognises, then turns the same circuit into a schematic and a PCB. The friendliest way to document a wiring diagram.',
    launchUrl: 'https://fritzing.org',
    difficulty: 'beginner',
    icon: null,
    logoUrl:
      'https://raw.githubusercontent.com/fritzing/fritzing-app/develop/resources/images/fritzing_icon.png',
  },
  {
    title: 'LTspice',
    slug: 'ltspice',
    description:
      'Free SPICE simulator from Analog Devices. The standard tool for checking an analog stage properly: transient, AC sweep, noise, and real vendor models.',
    launchUrl:
      'https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html',
    difficulty: 'advanced',
    icon: 'analogdevices',
  },
  // CAD and 3D printing
  {
    title: 'FreeCAD',
    slug: 'freecad',
    description:
      'Open source parametric CAD. Sketch, constrain, extrude, and change a dimension later without redrawing. The free answer to Fusion 360.',
    launchUrl: 'https://www.freecad.org',
    difficulty: 'intermediate',
    icon: 'freecad',
  },
  {
    title: 'OpenSCAD',
    slug: 'openscad',
    description:
      'CAD you write as code rather than draw. Parts become variables and loops, which suits brackets, jigs, and anything you want in six sizes.',
    launchUrl: 'https://openscad.org',
    difficulty: 'intermediate',
    icon: 'openscad',
  },
  {
    title: 'PrusaSlicer',
    slug: 'prusaslicer',
    description:
      'Open source slicer with solid defaults and deep control when you need it. Strong organic supports and paint on support painting.',
    launchUrl: 'https://www.prusa3d.com/page/prusaslicer_424/',
    difficulty: 'beginner',
    icon: null,
    logoUrl:
      'https://raw.githubusercontent.com/prusa3d/PrusaSlicer/master/resources/icons/PrusaSlicer.png',
  },
  // Firmware and emulation
  {
    title: 'PlatformIO',
    slug: 'platformio',
    description:
      'Embedded toolchain inside VS Code. One project file handles boards, libraries, and uploads across a thousand targets, with a real debugger attached.',
    launchUrl: 'https://platformio.org',
    difficulty: 'intermediate',
    icon: 'platformio',
  },
  {
    title: 'Thonny',
    slug: 'thonny',
    description:
      'Python IDE built for beginners, and the easiest way onto a Pico or an ESP32 with MicroPython. Flash the firmware and get a REPL in two clicks.',
    launchUrl: 'https://thonny.org',
    difficulty: 'beginner',
    icon: null,
    logoUrl: 'https://raw.githubusercontent.com/thonny/thonny/master/thonny/res/thonny.png',
  },
  {
    title: 'Renode',
    slug: 'renode',
    description:
      'Open source emulator for whole embedded systems, including the network between boards. Run and debug firmware for hardware you do not have yet.',
    launchUrl: 'https://renode.io',
    difficulty: 'advanced',
    icon: null,
  },
  {
    title: 'QEMU',
    slug: 'qemu',
    description:
      'Machine emulator and virtualiser. Boots an ARM or RISC-V system on your laptop, which is how you test a kernel or a Linux image without the board.',
    launchUrl: 'https://www.qemu.org',
    difficulty: 'advanced',
    icon: 'qemu',
  },
  // IoT platforms and general CS tooling
  {
    title: 'Node-RED',
    slug: 'node-red',
    description:
      'Wire IoT flows together by dragging nodes: MQTT in, logic in the middle, dashboard out. Built for exactly the plumbing an IoT project needs.',
    launchUrl: 'https://nodered.org',
    difficulty: 'beginner',
    icon: 'nodered',
  },
  {
    title: 'Home Assistant',
    slug: 'home-assistant',
    description:
      'Open source home automation hub that speaks to almost everything, ESPHome boards included. Where a sensor project turns into something the house uses.',
    launchUrl: 'https://www.home-assistant.io',
    difficulty: 'intermediate',
    icon: 'homeassistant',
  },
  {
    title: 'Visual Studio Code',
    slug: 'visual-studio-code',
    description:
      'The editor most of this runs in. Free, extensible, and the host for PlatformIO, Arduino, MicroPython, and every language you will touch.',
    launchUrl: 'https://code.visualstudio.com',
    difficulty: 'beginner',
    icon: null,
    logoUrl:
      'https://raw.githubusercontent.com/microsoft/vscode/main/resources/win32/code_150x150.png',
  },
  {
    title: 'Google Colab',
    slug: 'google-colab',
    description:
      'Python notebooks in the browser with a free GPU attached. Useful for the machine learning half of a project, before it gets squeezed onto a board.',
    launchUrl: 'https://colab.research.google.com',
    difficulty: 'beginner',
    icon: 'googlecolab',
  },
  {
    title: 'Godot',
    slug: 'godot',
    description:
      'Open source game engine, small and quick to learn. The free path into interactive 3D, visualisation, and simulation next to Unity.',
    launchUrl: 'https://godotengine.org',
    difficulty: 'intermediate',
    icon: 'godotengine',
  },
]

const ICON_SIZE = 512

/**
 * Fetch a simple-icons mark and rasterise it. Returns null on any failure, so a
 * missing slug or a network hiccup costs the logo and not the entry.
 */
async function fetchIcon(source: { slug?: string | null; url?: string }): Promise<Buffer | null> {
  const url = source.url ?? (source.slug ? `https://cdn.simpleicons.org/${source.slug}` : null)
  if (!url) return null
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EmbedClubSiteSeed/1.0' },
    })
    if (!res.ok) return null
    const source_ = Buffer.from(await res.arrayBuffer())
    if (source_.byteLength < 100) return null

    // Contain rather than cover, on a transparent canvas, so a wide mark is not
    // cropped and the card's own background shows through.
    return await sharp(source_, { density: 384 })
      .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  } catch {
    return null
  }
}

async function ensureIconMedia(
  payload: Payload,
  tool: ToolSeed,
): Promise<{ id: number; hadLogo: boolean }> {
  const filename = `${tool.slug}Logo.png`
  const webpName = `${tool.slug}Logo.webp`

  const found = await payload.find({
    collection: 'media',
    where: { filename: { equals: webpName } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs.length > 0) return { id: found.docs[0].id as number, hadLogo: true }

  const png = await fetchIcon({ slug: tool.icon, url: tool.logoUrl })
  if (!png) {
    return { id: await ensurePlaceholderMedia(payload), hadLogo: false }
  }

  const media = await payload.create({
    collection: 'media',
    data: { alt: `${tool.title} logo` },
    file: { data: png, name: filename, mimetype: 'image/png', size: png.byteLength },
    overrideAccess: true,
  })
  return { id: media.id as number, hadLogo: true }
}

async function run() {
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0
  const needLogo: string[] = []

  for (const tool of TOOLS) {
    const { id: thumbnail, hadLogo } = await ensureIconMedia(payload, tool)
    if (!hadLogo) needLogo.push(tool.title)

    const data = {
      title: tool.title,
      slug: tool.slug,
      description: tool.description,
      launchType: 'website' as const,
      launchUrl: tool.launchUrl,
      difficulty: tool.difficulty,
      thumbnail,
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
      updated++
    } else {
      await payload.create({ collection: 'simulators', data, draft: false, overrideAccess: true })
      created++
    }
    console.log(`${hadLogo ? 'ok      ' : 'no logo '} ${tool.title}`)
  }

  console.log(`\nTools seeded. created: ${created}, updated: ${updated}`)
  if (needLogo.length > 0) {
    console.log(`Needs a logo uploaded by hand: ${needLogo.join(', ')}`)
  }
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
