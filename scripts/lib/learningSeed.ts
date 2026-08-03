/**
 * Shared authoring helpers for Resource / Tutorial seed scripts.
 *
 * Payload stores rich text as a Lexical tree; these builders mirror the exact
 * node shape the editor writes, so seeded documents are indistinguishable from
 * hand-authored ones and stay editable in the admin. Extracted here so each
 * seed script describes only its content, not the machinery.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { generateSlug } from '@/payload/collections/learningFields'
import type { CodeBlock } from '@/payload/payload-types'
import type { Payload } from 'payload'

// `type` and `version` are required on every Lexical node by Payload's
// generated richText types, so they are named here rather than left open.
export type Node = { [k: string]: unknown; type: string; version: number }

/** Text-format bitmask, matching Lexical. */
const BOLD = 1
const ITALIC = 2
const CODE = 16

export function text(value: string, format = 0): Node {
  return { mode: 'normal', text: value, type: 'text', style: '', detail: 0, format, version: 1 }
}

export const bold = (value: string) => text(value, BOLD)
export const italic = (value: string) => text(value, ITALIC)
export const code = (value: string) => text(value, CODE)

export function heading(tag: 'h1' | 'h2' | 'h3', children: Node[], format = ''): Node {
  return { tag, type: 'heading', format, indent: 0, version: 1, children, direction: 'ltr' }
}

export function paragraph(children: Node[], format = ''): Node {
  return {
    type: 'paragraph',
    format,
    indent: 0,
    version: 1,
    children,
    direction: 'ltr',
    textFormat: 0,
  }
}

export function list(type: 'number' | 'bullet', items: Node[][]): Node {
  return {
    tag: type === 'number' ? 'ol' : 'ul',
    type: 'list',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    listType: type,
    direction: 'ltr',
    children: items.map((children, i) => ({
      type: 'listitem',
      value: i + 1,
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    })),
  }
}

/** Wrap top-level nodes in a Lexical root, ready for a richText field. */
export function richText(children: Node[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children,
    },
  }
}

export const textBlock = (children: Node[]) => ({
  blockType: 'textBlock' as const,
  text: richText(children),
})

export const codeBlock = (language: CodeBlock['language'], snippet: string, caption?: string) => ({
  blockType: 'codeBlock' as const,
  language,
  code: snippet,
  ...(caption ? { caption } : {}),
})

/**
 * A card linking out to a simulator. `simulatorId` is a `simulators` document id
 * — resolve it with `simulatorId(payload, 'arduino-ide')` rather than hardcoding
 * a number.
 */
export const simulatorLinkBlock = (simulator: number, buttonText?: string) => ({
  blockType: 'simulatorLinkBlock' as const,
  simulator,
  ...(buttonText ? { buttonText } : {}),
})

/**
 * Insert blocks immediately after the block carrying `caption`.
 *
 * Used to drop a simulator card into the middle of an existing page — next to
 * the step that tells the reader to install the Arduino IDE, rather than at the
 * bottom where nobody looks for it. Anchored on the caption text so it survives
 * the page being reordered; throws rather than silently appending if the anchor
 * is gone, since a link that quietly moves to the end is worse than a failure.
 */
export function insertAfterCaption<T, U>(
  blocks: T[],
  caption: string,
  // Separate type parameter: the inserted block is a different shape from the
  // ones already in the array, and requiring it to match T would mean every
  // caller widening its content array by hand.
  ...inserted: U[]
): (T | U)[] {
  const index = blocks.findIndex(
    (block) => (block as { caption?: string })?.caption?.includes(caption) ?? false,
  )
  if (index === -1) throw new Error(`no block with caption containing "${caption}"`)
  return [...blocks.slice(0, index + 1), ...inserted, ...blocks.slice(index + 1)]
}

/** Look up a simulator's id by slug, so seeds name it instead of numbering it. */
export async function simulatorId(payload: Payload, slug: string): Promise<number> {
  const found = await payload.find({
    collection: 'simulators',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })
  const doc = found.docs[0]
  if (!doc) throw new Error(`no simulator with slug "${slug}"`)
  return doc.id as number
}

/** One collapsible section. `blocks` may not contain rows or further accordions. */
export const accordionItem = (
  title: string,
  blocks: unknown[],
  opts: { summary?: string; defaultOpen?: boolean } = {},
) => ({
  title,
  blocks,
  ...(opts.summary ? { summary: opts.summary } : {}),
  defaultOpen: opts.defaultOpen ?? false,
})

/** A set of collapsible sections. */
export const accordionBlock = (items: ReturnType<typeof accordionItem>[], heading?: string) => ({
  blockType: 'accordionBlock' as const,
  items,
  ...(heading ? { heading } : {}),
})

type ImageSize = 'small' | 'medium' | 'large'

/** A real image block, referencing an uploaded media id. */
export const imageBlock = (mediaId: number, caption?: string, size: ImageSize = 'large') => ({
  blockType: 'imageBlock' as const,
  image: mediaId,
  ...(caption ? { caption } : {}),
  size,
})

/**
 * An image slot the editor is meant to fill in later. Every image is the same
 * placeholder graphic; the caption — prefixed so it is impossible to miss in
 * the list — says which real screenshot belongs there.
 */
export const placeholderImage = (mediaId: number, whatGoesHere: string) => ({
  blockType: 'imageBlock' as const,
  image: mediaId,
  caption: `PLACEHOLDER — replace with: ${whatGoesHere}`,
  size: 'large' as const,
})

/**
 * Upload an image from an absolute path into the media collection, or reuse it
 * if already present. Matched on the webp filename Payload derives (the media
 * collection converts every upload to webp), so re-runs don't duplicate.
 */
export async function ensureMediaFromFile(
  payload: Payload,
  absPath: string,
  alt: string,
): Promise<number> {
  const base = path.basename(absPath)
  const stem = base.replace(/\.[^.]+$/, '')
  const webpName = `${stem}.webp`

  const found = await payload.find({
    collection: 'media',
    where: { filename: { equals: webpName } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs.length > 0) return found.docs[0].id as number

  const data = readFileSync(absPath)
  const ext = base.toLowerCase().split('.').pop()
  const mimetype =
    ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'

  const media = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, name: base, mimetype, size: data.byteLength },
    overrideAccess: true,
  })
  return media.id as number
}

/**
 * Reuse one shared "replace me" placeholder image, uploading it the first time.
 * Uploaded under a distinctive name (`seedPlaceholder.webp` after Payload's webp
 * conversion) and matched on it, so re-runs reuse the same doc rather than
 * piling up copies, and an unrelated media file called "placeholder" is safe.
 */
export async function ensurePlaceholderMedia(payload: Payload): Promise<number> {
  const found = await payload.find({
    collection: 'media',
    where: { filename: { like: 'seedPlaceholder' } },
    sort: 'id',
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs.length > 0) return found.docs[0].id as number

  const data = readFileSync(path.resolve(process.cwd(), 'public/placeholder/placeholder.jpg'))
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Placeholder — replace with the described screenshot' },
    // Explicit file object so the stored stem is `seedPlaceholder`, not the
    // source's generic `placeholder`.
    file: { data, name: 'seedPlaceholder.jpg', mimetype: 'image/jpeg', size: data.byteLength },
    overrideAccess: true,
  })
  return media.id as number
}

/**
 * Resolve tag names to ids, creating any that do not exist yet.
 *
 * Seed scripts name their tags rather than hardcoding ids: the ids are database
 * state an officer can change from the admin, and a stale number silently tags a
 * document with the wrong thing rather than failing. Matching is exact on
 * `name`, which the collection already declares unique.
 */
export async function ensureTagIds(payload: Payload, names: string[]): Promise<number[]> {
  const ids: number[] = []
  for (const name of names) {
    const found = await payload.find({
      collection: 'tags',
      where: { name: { equals: name } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs.length > 0) {
      ids.push(found.docs[0].id as number)
      continue
    }
    // The collection's own hook would fill `slug`, but it is a required field,
    // so the create call has to satisfy the type before the hook ever runs.
    // `generateSlug` is the same function that hook uses.
    const created = await payload.create({
      collection: 'tags',
      data: { name, slug: generateSlug(name) },
      overrideAccess: true,
    })
    ids.push(created.id as number)
    console.log(`Created tag ${created.id} (${name}).`)
  }
  return ids
}

/**
 * Create or update a learning document (Resource or Tutorial) by slug, so the
 * seed is re-runnable without duplicating. Returns nothing; logs what it did.
 */
export async function upsertLearningDoc({
  payload,
  collection,
  slug,
  data,
}: {
  payload: Payload
  collection: 'resources' | 'tutorials'
  slug: string
  // Field shape matches learningFields.ts; the generated per-collection type is
  // narrower than this helper needs to be, so the payload is passed untyped.
  data: Record<string, unknown>
}) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    const id = existing.docs[0].id
    // biome-ignore lint/suspicious/noExplicitAny: cross-collection data shape, see note above
    await payload.update({ collection, id, data: data as any, overrideAccess: true })
    console.log(`Updated existing ${collection} ${id} (${slug}).`)
  } else {
    // biome-ignore lint/suspicious/noExplicitAny: cross-collection data shape, see note above
    const created = await payload.create({ collection, data: data as any, overrideAccess: true })
    console.log(`Created ${collection} ${created.id} (${slug}).`)
  }
  console.log(`View at /${collection}/${slug}`)
}

/** Flush stdout before exiting — `process.exit` truncates a piped buffer. */
export function flushExit(code: number) {
  process.stdout.write('', () => process.exit(code))
}
