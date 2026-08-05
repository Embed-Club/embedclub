'use client'
import React from 'react'

/**
 * RichTextRender - Renders Payload CMS Lexical editor content
 *
 * Covers the node types Payload's default `lexicalEditor()` can produce:
 * - Paragraphs, headings (h1-h6), with per-block alignment and indent
 * - Text formatting (bold, italic, underline, strikethrough, code, sub/superscript)
 * - Links (internal + external), lists (ordered/unordered/checklist), quotes
 * - Uploads (images placed inline in the editor), horizontal rules, line breaks
 *
 * Alignment and indent live on the *block* node as `format` (a string) and
 * `indent` (a number) — distinct from the `format` bitmask on text nodes. Both
 * were previously dropped, which is why centred text came out left-aligned.
 */

/** Lexical text-format bitmask. */
const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16
const FORMAT_SUBSCRIPT = 32
const FORMAT_SUPERSCRIPT = 64

/** Block-level `format` is an alignment keyword (or '' for the default). */
const ALIGNMENT_CLASSES: Record<string, string> = {
  left: 'text-left',
  start: 'text-left',
  center: 'text-center',
  right: 'text-right',
  end: 'text-right',
  justify: 'text-justify',
}

/**
 * Indent steps, spelled out rather than built with a template string —
 * Tailwind's JIT scans source text, so a computed `ps-${n}` never gets emitted.
 */
const INDENT_CLASSES = ['', 'ps-4', 'ps-8', 'ps-12', 'ps-16', 'ps-20', 'ps-24', 'ps-28', 'ps-32']

/**
 * Alignment + indent classes for a block node. Indent is Lexical's
 * "increase indent" toolbar action, one step per level.
 */
function blockClasses(node: Record<string, unknown>, base: string): string {
  const classes = [base]

  const align = typeof node.format === 'string' ? ALIGNMENT_CLASSES[node.format] : undefined
  if (align) classes.push(align)

  const indent = typeof node.indent === 'number' ? node.indent : 0
  if (indent > 0) classes.push(INDENT_CLASSES[Math.min(indent, INDENT_CLASSES.length - 1)])

  return classes.filter(Boolean).join(' ')
}

/**
 * Recursively render inline text nodes with formatting
 */
function renderTextNode(node: Record<string, unknown>, key: number): React.ReactNode {
  if (!node) return null

  // Base text content
  let content: React.ReactNode = (node.text as string) || ''

  if (node.format && typeof node.format === 'number') {
    const format = node.format
    if (format & FORMAT_BOLD) content = <strong>{content}</strong>
    if (format & FORMAT_ITALIC) content = <em>{content}</em>
    if (format & FORMAT_UNDERLINE) content = <u>{content}</u>
    if (format & FORMAT_STRIKETHROUGH) content = <s>{content}</s>
    if (format & FORMAT_SUBSCRIPT) content = <sub>{content}</sub>
    if (format & FORMAT_SUPERSCRIPT) content = <sup>{content}</sup>
    if (format & FORMAT_CODE)
      content = <code className="rounded bg-muted px-1 py-0.5 text-sm">{content}</code>
  }

  return <React.Fragment key={key}>{content}</React.Fragment>
}

/**
 * Render an `upload` node — an image dropped straight into the rich text, as
 * opposed to a standalone Image Block.
 */
function renderUploadNode(node: Record<string, unknown>, key: number): React.ReactNode {
  const value = node.value as Record<string, unknown> | undefined
  const url = typeof value?.url === 'string' ? value.url : null
  if (!url) return null

  const alt = typeof value?.alt === 'string' ? value.alt : ''
  const caption = typeof value?.caption === 'string' ? value.caption : ''

  return (
    <figure key={key} className="my-6 flex flex-col gap-2">
      {/* Plain <img>: rich-text uploads have no known layout box, and the
          editor allows arbitrary remote media that next/image can't optimise
          without every host being allow-listed in next.config. */}
      <img src={url} alt={alt} className="h-auto w-full rounded-xl border border-border" />
      {caption && (
        <figcaption className="text-center text-sm italic text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Render a block-level node (paragraph, heading, list, etc.)
 *
 * `nextHeadingId` hands out pre-computed anchor ids in document order so the
 * "On this page" nav can link to them — see `lib/richTextHeadings.ts`.
 */
function renderNode(
  node: Record<string, unknown>,
  key: number,
  nextHeadingId: () => string | undefined,
): React.ReactNode {
  if (!node) return null

  const { type, children = [] } = node

  // Text nodes (inline content)
  if (node.text !== undefined) {
    return renderTextNode(node, key)
  }

  if (type === 'upload') {
    return renderUploadNode(node, key)
  }

  if (type === 'horizontalrule') {
    return <hr key={key} className="my-8 border-border" />
  }

  if (type === 'tab') {
    return <span key={key} className="inline-block w-8" />
  }

  // Link nodes
  if (type === 'link' || type === 'autolink') {
    const linkChildren = (children as Array<Record<string, unknown>>).map((child, i) =>
      renderNode(child, i, nextHeadingId),
    )
    const fields = node.fields as Record<string, unknown> | undefined
    const doc = fields?.doc as Record<string, unknown> | undefined
    const href =
      (fields?.url as string) ||
      (node.url as string) ||
      (typeof doc?.value === 'object' && doc?.value !== null
        ? `/${(doc.value as Record<string, unknown>).slug}`
        : '') ||
      '#'
    const target = fields?.newTab ? '_blank' : undefined
    const rel = fields?.newTab ? 'noopener noreferrer' : undefined

    return (
      <a
        key={key}
        href={href}
        target={target}
        rel={rel}
        className="text-primary underline underline-offset-2 transition-colors hover:text-primary/80 break-words"
      >
        {linkChildren}
      </a>
    )
  }

  // Render child nodes
  const renderedChildren = (children as Array<Record<string, unknown>>).map((child, i) =>
    renderNode(child, i, nextHeadingId),
  )

  // Block-level elements
  switch (type) {
    case 'paragraph':
      return (
        <p key={key} className={blockClasses(node, 'mb-4 leading-relaxed')}>
          {renderedChildren}
        </p>
      )

    case 'heading': {
      const headingTag = (node.tag as string) || 'h2'
      const headingSizes: Record<string, string> = {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-semibold mb-3',
        h3: 'text-xl font-semibold mb-3',
        h4: 'text-lg font-semibold mb-2',
        h5: 'text-base font-semibold mb-2',
        h6: 'text-sm font-semibold mb-2',
      }
      // h1 is the page title's job, so only h2+ get TOC anchors.
      const id = headingTag === 'h1' ? undefined : nextHeadingId()
      return React.createElement(
        headingTag,
        {
          key,
          id,
          // Clears the fixed nav when jumped to from the table of contents.
          className: blockClasses(
            node,
            `scroll-mt-24 ${headingSizes[headingTag as string] || headingSizes.h2}`,
          ),
        },
        renderedChildren,
      )
    }

    case 'list': {
      const listType = node.listType as string
      if (listType === 'check') {
        return (
          <ul key={key} className={blockClasses(node, 'mb-4 ml-6 space-y-1 list-none')}>
            {renderedChildren}
          </ul>
        )
      }
      const listTag = listType === 'number' ? 'ol' : 'ul'
      const listClass =
        listType === 'number' ? 'mb-4 ml-6 list-decimal space-y-1' : 'mb-4 ml-6 list-disc space-y-1'
      return React.createElement(
        listTag,
        { key, className: blockClasses(node, listClass) },
        renderedChildren,
      )
    }

    case 'listitem': {
      // Checklist items carry their state on the node; render a real disabled
      // checkbox so the published page matches what the editor shows.
      if (typeof node.checked === 'boolean') {
        return (
          <li key={key} className="flex items-start gap-2 leading-relaxed">
            <input
              type="checkbox"
              checked={node.checked}
              readOnly
              disabled
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>{renderedChildren}</span>
          </li>
        )
      }
      return (
        <li key={key} className="leading-relaxed">
          {renderedChildren}
        </li>
      )
    }

    case 'quote':
      return (
        <blockquote
          key={key}
          className={blockClasses(
            node,
            'mb-4 border-l-4 border-border pl-4 italic text-muted-foreground',
          )}
        >
          {renderedChildren}
        </blockquote>
      )

    case 'linebreak':
      return <br key={key} />

    default:
      // For unknown types, try to render children anyway
      if (renderedChildren.length > 0) {
        return <React.Fragment key={key}>{renderedChildren}</React.Fragment>
      }
      return null
  }
}

/**
 * Main component - handles the top-level Lexical document structure
 */
export default function RichTextRender({
  content,
  value,
  headingIds,
}: {
  content?: Record<string, unknown> | Array<unknown>
  value?: Record<string, unknown> | Array<unknown>
  /** Anchor ids for this field's headings, in document order. */
  headingIds?: string[]
}) {
  // Support both 'content' and 'value' prop names for flexibility
  const data = content || value

  if (!data) return null

  // Extract the blocks array from Lexical's root structure
  let blocks: Array<Record<string, unknown>> = []

  // biome-ignore lint/suspicious/noExplicitAny: complex dynamic structure
  if (data && typeof data === 'object' && 'root' in data && (data.root as any)?.children) {
    // Standard Lexical format: { root: { children: [...] } }
    // biome-ignore lint/suspicious/noExplicitAny: complex dynamic structure
    blocks = (data.root as any).children as Array<Record<string, unknown>>
  } else if (Array.isArray(data)) {
    // Already an array of blocks
    blocks = data as Array<Record<string, unknown>>
  } else if (data && typeof data === 'object' && 'children' in data) {
    // Direct children array
    // biome-ignore lint/suspicious/noExplicitAny: complex dynamic structure
    blocks = (data as any).children as Array<Record<string, unknown>>
  }

  if (blocks.length === 0) return null

  let headingCursor = 0
  const nextHeadingId = () => headingIds?.[headingCursor++]

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      {blocks.map((block, i) => renderNode(block, i, nextHeadingId))}
    </div>
  )
}
