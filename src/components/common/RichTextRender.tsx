'use client'
import React from 'react'

/**
 * RichTextRender - Renders Payload CMS Lexical editor content
 *
 * This component handles the Lexical rich text format from Payload CMS.
 * It supports:
 * - Paragraphs, headings (h1-h6)
 * - Text formatting (bold, italic, underline, strikethrough, code)
 * - Links
 * - Lists (ordered/unordered)
 * - Block quotes
 * - Line breaks
 */

/**
 * Recursively render inline text nodes with formatting
 */
function renderTextNode(node: Record<string, unknown>, key: number): React.ReactNode {
  if (!node) return null

  // Base text content
  let content: React.ReactNode = (node.text as string) || ''

  // Apply text formatting using bitwise flags
  // Lexical uses bit flags: 1=bold, 2=italic, 4=strikethrough, 8=underline, etc.
  if (node.format && typeof node.format === 'number') {
    if (node.format & 1) content = <strong>{content}</strong> // Bold
    if (node.format & 2) content = <em>{content}</em> // Italic
    if (node.format & 8) content = <u>{content}</u> // Underline
    if (node.format & 4) content = <s>{content}</s> // Strikethrough
    if (node.format & 16)
      content = (
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-sm dark:bg-neutral-800">
          {content}
        </code>
      ) // Code
  }

  return <React.Fragment key={key}>{content}</React.Fragment>
}

/**
 * Render a block-level node (paragraph, heading, list, etc.)
 */
function renderNode(node: Record<string, unknown>, key: number): React.ReactNode {
  if (!node) return null

  const { type, children = [] } = node

  // Text nodes (inline content)
  if (node.text !== undefined) {
    return renderTextNode(node, key)
  }

  // Link nodes
  if (type === 'link') {
    const linkChildren = (children as Array<Record<string, unknown>>).map((child, i) =>
      renderNode(child, i),
    )
    const fields = node.fields as Record<string, unknown> | undefined
    const href = (fields?.url as string) || (node.url as string) || '#'
    const target = fields?.newTab ? '_blank' : undefined
    const rel = fields?.newTab ? 'noopener noreferrer' : undefined

    return (
      <a
        key={key}
        href={href}
        target={target}
        rel={rel}
        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {linkChildren}
      </a>
    )
  }

  // Render child nodes
  const renderedChildren = (children as Array<Record<string, unknown>>).map((child, i) =>
    renderNode(child, i),
  )

  // Block-level elements
  switch (type) {
    case 'paragraph':
      return (
        <p key={key} className="mb-4 leading-relaxed">
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
      return React.createElement(
        headingTag,
        { key, className: headingSizes[headingTag as string] || headingSizes.h2 },
        renderedChildren,
      )
    }

    case 'list': {
      const listTag = (node.listType as string) === 'number' ? 'ol' : 'ul'
      const listClass =
        (node.listType as string) === 'number'
          ? 'mb-4 ml-6 list-decimal space-y-1'
          : 'mb-4 ml-6 list-disc space-y-1'
      return React.createElement(listTag, { key, className: listClass }, renderedChildren)
    }

    case 'listitem':
      return (
        <li key={key} className="leading-relaxed">
          {renderedChildren}
        </li>
      )

    case 'quote':
      return (
        <blockquote
          key={key}
          className="mb-4 border-l-4 border-neutral-300 pl-4 italic text-neutral-700 dark:border-neutral-600 dark:text-neutral-300"
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
}: {
  content?: Record<string, unknown> | Array<unknown>
  value?: Record<string, unknown> | Array<unknown>
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

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      {blocks.map((block, i) => renderNode(block, i))}
    </div>
  )
}
