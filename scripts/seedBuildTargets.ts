/**
 * Seed the boards on the Build page. One doc per board; matched on slug, so
 * re-running updates in place.
 *
 *   BUILD_THUMBS=<dir> pnpm tsx scripts/seedBuildTargets.ts
 *
 * `<dir>` holds `<slug>.jpg` thumbnails.
 */
import 'dotenv/config'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { BuildTarget } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { getPayload } from 'payload'
import { flushExit } from './lib/learningSeed'

const TARGETS = [
  {
    slug: 'microbit',
    title: 'micro:bit',
    description:
      'Drag blocks or write MicroPython, then flash it straight to the board over USB - no install, nothing to download.',
    editor: 'microbitPython' as const,
    difficulty: 'beginner' as const,
    tags: ['micro:bit', 'MicroPython'],
    notes: [
      'Plug the micro:bit into this computer with a data USB cable (some charge-only cables will not work).',
      'Press Flash. Chrome asks which device to use - pick "BBC micro:bit CMSIS-DAP".',
      'If Chrome says no compatible devices were found, the board needs a firmware update: hold RESET while plugging in, drop the firmware hex from microbit.org onto the MAINTENANCE drive, then try again. Until then, Download .hex and drag it onto the MICROBIT drive.',
    ],
  },
]

async function ensureTagIds(payload: Awaited<ReturnType<typeof getPayload>>, names: string[]) {
  const ids: number[] = []
  for (const name of names) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const tag =
      existing.docs[0] ?? (await payload.create({ collection: 'tags', data: { name, slug } }))
    ids.push(tag.id)
  }
  return ids
}

/** A Lexical document of plain paragraphs - what the `notes` rich text field stores. */
function paragraphs(lines: string[]): BuildTarget['notes'] {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: lines.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}

async function main() {
  const dir = process.env.BUILD_THUMBS
  if (!dir || !existsSync(dir))
    throw new Error('Set BUILD_THUMBS to a directory of <slug>.jpg files')

  const payload = await getPayload({ config })

  for (const target of TARGETS) {
    const thumbPath = path.join(dir, `${target.slug}.jpg`)
    if (!existsSync(thumbPath)) throw new Error(`missing ${thumbPath}`)

    const thumb = await payload.create({
      collection: 'media',
      data: { alt: `${target.title} board` },
      filePath: thumbPath,
    })

    const data = {
      title: target.title,
      slug: target.slug,
      description: target.description,
      thumbnail: thumb.id,
      editor: target.editor,
      difficulty: target.difficulty,
      tags: await ensureTagIds(payload, target.tags),
      notes: paragraphs(target.notes),
    }

    const existing = await payload.find({
      collection: 'build-targets',
      where: { slug: { equals: target.slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'build-targets', id: existing.docs[0].id, data })
      payload.logger.info(`updated ${target.slug}`)
    } else {
      await payload.create({ collection: 'build-targets', data })
      payload.logger.info(`created ${target.slug}`)
    }
  }
}

main()
  .then(() => flushExit(0))
  .catch((error) => {
    console.error(error)
    flushExit(1)
  })
