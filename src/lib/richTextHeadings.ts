/**
 * Heading extraction for the Resources/Tutorials "On this page" table of
 * contents.
 *
 * The renderer (`richTextRender.tsx`) and the TOC must agree on anchor ids, so
 * both derive them from `headingSlug` here rather than each rolling their own.
 */

export interface RichTextHeading {
  id: string
  text: string
  /** 2-6. `h1` is reserved for the page title, so headings start at h2. */
  level: number
}

/** Mirrors `generateSlug` in the Payload collections — same rules, plain text. */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Flatten a Lexical node's descendant text nodes into a single string. */
function nodeText(node: Record<string, unknown>): string {
  if (typeof node.text === 'string') return node.text
  const children = node.children
  if (!Array.isArray(children)) return ''
  return children.map((child) => nodeText(child as Record<string, unknown>)).join('')
}

/** Pull the `root.children` array out of any of the shapes Payload hands us. */
function lexicalChildren(data: unknown): Array<Record<string, unknown>> {
  if (!data || typeof data !== 'object') return []
  const asRecord = data as Record<string, unknown>
  const root = asRecord.root as Record<string, unknown> | undefined
  if (root && Array.isArray(root.children)) return root.children as Array<Record<string, unknown>>
  if (Array.isArray(asRecord.children)) return asRecord.children as Array<Record<string, unknown>>
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  return []
}

/**
 * Walk a document's content blocks and collect every rich-text heading, in
 * document order. Recurses into rowBlock so headings inside columns still land
 * in the TOC.
 *
 * Duplicate headings get a `-2`, `-3`, … suffix so every anchor stays unique —
 * repeated headings like "Wiring" under different sections are common.
 */
export function collectHeadings(blocks: unknown): RichTextHeading[] {
  const headings: RichTextHeading[] = []
  const seen = new Map<string, number>()

  const pushHeading = (text: string, level: number) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const base = headingSlug(trimmed)
    if (!base) return
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    headings.push({ id: count === 1 ? base : `${base}-${count}`, text: trimmed, level })
  }

  const walkRichText = (content: unknown) => {
    for (const node of lexicalChildren(content)) {
      if (node.type !== 'heading') continue
      const tag = typeof node.tag === 'string' ? node.tag : 'h2'
      const level = Number.parseInt(tag.replace('h', ''), 10)
      if (!Number.isFinite(level) || level < 2) continue
      pushHeading(nodeText(node), level)
    }
  }

  const walkBlocks = (list: unknown) => {
    if (!Array.isArray(list)) return
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue
      const block = entry as Record<string, unknown>
      if (block.blockType === 'textBlock') walkRichText(block.text)
      if (block.blockType === 'rowBlock') walkBlocks(block.blocks)
    }
  }

  walkBlocks(blocks)
  return headings
}

/** How many TOC headings a single block contributes, rows included. */
function countHeadings(block: unknown): number {
  return collectHeadings([block]).length
}

/**
 * Deal an ordered id list out to a block list, so each block receives exactly
 * the ids for the headings it renders.
 *
 * Ids are minted once for the whole document (`collectHeadings`), because
 * de-duplication needs to see every heading at once. Rendering, though, happens
 * per block — so the ids have to be handed down the tree rather than recomputed,
 * or a block would have no way to know it holds the *second* "Wiring" heading.
 * Both walks visit blocks in the same order, which is what keeps them aligned.
 */
export function splitHeadingIds(blocks: unknown, ids: string[]): string[][] {
  if (!Array.isArray(blocks)) return []
  let cursor = 0
  return blocks.map((block) => {
    const count = countHeadings(block)
    const slice = ids.slice(cursor, cursor + count)
    cursor += count
    return slice
  })
}
