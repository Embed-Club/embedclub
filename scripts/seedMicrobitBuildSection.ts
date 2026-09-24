/**
 * Add the "Program It Right Here" section to the micro:bit tutorial: a card
 * for the Build page, what the in-browser editor can do (with screenshots),
 * a pointer to the official micro:bit site, and a nudge back to Build.
 *
 *   pnpm tsx scripts/seedMicrobitBuildSection.ts <screenshot folder>
 *
 * The folder holds the four screenshots named in SHOTS below. They are taken
 * from a running copy of the site (1440px wide, dark theme) rather than kept in
 * the repo, like the other seeds' photos.
 *
 * Patches the live document instead of re-running seedMicrobitTutorial.ts, so
 * anything changed in the admin since - swapped-in screenshots, edited copy -
 * is kept. Goes in after the "Two Ways to Program It" section. Re-running is a
 * no-op once the Build card is there.
 */
import 'dotenv/config'
import path from 'node:path'
import type { Tutorial } from '@/payload/payload-types'
import config from '@payload-config'
import { type Payload, getPayload } from 'payload'
import {
  bold,
  code,
  ensureMediaFromFile,
  flushExit,
  heading,
  imageBlock,
  link,
  list,
  paragraph,
  text,
  textBlock,
} from './lib/learningSeed'

const SLUG = 'microbit-setup-and-first-programs'
const BUILD_SLUG = 'microbit'
const AFTER_HEADING = 'Two Ways to Program It'

const SHOTS = {
  build: ['embedclub-build.png', 'The Embed Club Build page, listing the boards you can program'],
  blocks: ['microbit-build-blocks-compass.png', 'The Compass example open in the blocks editor'],
  python: ['microbit-build-python-compass.png', 'The same Compass blocks, switched to Python'],
  examples: ['microbit-build-examples.png', 'The examples under the micro:bit editor'],
} as const

type Block = NonNullable<Tutorial['content']>[number]

/** Text of every heading node inside a textBlock's Lexical tree, concatenated. */
function headingText(block: Block): string {
  if (block.blockType !== 'textBlock') return ''
  const children = block.text?.root?.children ?? []
  return children
    .filter((node) => node.type === 'heading')
    .flatMap((node) => (node as { children?: { text?: string }[] }).children ?? [])
    .map((leaf) => leaf.text ?? '')
    .join('')
}

async function buildTargetId(payload: Payload, slug: string): Promise<number> {
  const found = await payload.find({
    collection: 'build-targets',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const doc = found.docs[0]
  if (!doc) throw new Error(`no build target with slug "${slug}"`)
  return doc.id
}

function section(board: number, img: Record<keyof typeof SHOTS, number>) {
  return [
    textBlock([
      heading('h2', [text('Program It Right Here on Embed Club')]),
      paragraph([
        text('You do not have to leave this site to do any of this. The '),
        link([bold('Build page')], '/build'),
        text(
          ' has a micro:bit editor built in: drag blocks or write MicroPython, then flash the board over USB from the same tab. Nothing to install, no account, no file to find in your Downloads folder.',
        ),
      ]),
    ]),
    { blockType: 'buildLinkBlock' as const, buildTarget: board },
    imageBlock(img.build, SHOTS.build[1]),

    textBlock([
      heading('h3', [text('What you can do there')]),
      list('bullet', [
        [
          bold('Blocks and Python in one editor. '),
          text(
            'Build a program from blocks, then switch to the Python tab and see the code those blocks stand for. It is the quickest way to move from one to the other.',
          ),
        ],
        [
          bold('Flash straight to the board. '),
          text('Plug the micro:bit in, press '),
          bold('Flash'),
          text(' in Chrome or Edge, and pick the board. On any other browser, '),
          bold('Download .hex'),
          text(' and drag it onto the MICROBIT drive, the same as with the official editors.'),
        ],
        [
          bold('A serial console. '),
          text('Anything your program '),
          code('print()'),
          text('s shows up under the editor while the board is connected.'),
        ],
        [
          bold('Ready-made examples. '),
          text(
            'Thirteen programs to load, flash and pull apart - a compass, a rolling marble, a step counter, rock paper scissors, radio chat between two boards and more. The compass and the other sensor examples all run on a V1 board as well as a V2.',
          ),
        ],
      ]),
    ]),
    imageBlock(img.blocks, SHOTS.blocks[1]),
    imageBlock(img.python, SHOTS.python[1]),
    imageBlock(img.examples, SHOTS.examples[1]),

    textBlock([
      heading('h3', [text('The official micro:bit editors')]),
      paragraph([
        text('The Micro:bit Educational Foundation runs the official site at '),
        link([bold('microbit.org')], 'https://microbit.org/', { newTab: true }),
        text(
          ', with MakeCode and the Python editor. Both are covered in the rest of this tutorial and both are worth knowing - MakeCode has an on-screen simulator, and the foundation publishes lesson plans and project ideas for every level.',
        ),
      ]),
      paragraph([
        text(
          'Anything you make there can be made on the Build page too: it is the same MicroPython running on the same board. And there is more to it than the examples show - music, servos on the pins, timers that run alongside ',
        ),
        code('forever'),
        text(', and functions of your own. Open '),
        link([bold('Build')], `/build/${BUILD_SLUG}`),
        text(', load an example, and start changing it.'),
      ]),
    ]),
  ]
}

async function main() {
  const dir = process.argv[2]
  if (!dir)
    throw new Error('usage: pnpm tsx scripts/seedMicrobitBuildSection.ts <screenshot folder>')

  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'tutorials',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const doc = found.docs[0]
  if (!doc) throw new Error(`no tutorial with slug "${SLUG}"`)

  const content = (doc.content ?? []) as Block[]
  if (content.some((block) => block.blockType === 'buildLinkBlock')) {
    console.log(`Build card already present on ${SLUG} - nothing to do.`)
    return
  }

  const anchor = content.findIndex((block) => headingText(block).includes(AFTER_HEADING))
  if (anchor === -1) throw new Error(`no block with a heading containing "${AFTER_HEADING}"`)

  const img = {} as Record<keyof typeof SHOTS, number>
  for (const [key, [file, alt]] of Object.entries(SHOTS) as [
    keyof typeof SHOTS,
    readonly [string, string],
  ][]) {
    img[key] = await ensureMediaFromFile(payload, path.resolve(dir, file), alt)
  }

  const board = await buildTargetId(payload, BUILD_SLUG)
  await payload.update({
    collection: 'tutorials',
    id: doc.id,
    data: {
      content: [
        ...content.slice(0, anchor + 1),
        ...section(board, img),
        ...content.slice(anchor + 1),
      ] as Block[],
    },
    overrideAccess: true,
  })
  console.log(`Added the Build section to tutorial ${doc.id} (${SLUG}).`)
  console.log(`View at /tutorials/${SLUG}`)
}

main()
  .then(() => flushExit(0))
  .catch((err) => {
    console.error(err)
    flushExit(1)
  })
