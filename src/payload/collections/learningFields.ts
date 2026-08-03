import { getServerSideURL } from '@/lib/getUrl'
import type { CollectionConfig, Field } from 'payload'

import {
  AccordionBlock,
  CodeBlock,
  GraphBlock,
  ImageBlock,
  RowBlock,
  SimulatorLinkBlock,
  TableBlock,
  TextBlock,
  VideoBlock,
} from './contentBlocks'

/**
 * Generate a URL-friendly slug from text
 * Converts: "Raspberry Pi Setup Guide" -> "raspberry-pi-setup-guide"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/** Card descriptions are clamped to two lines in the UI — stop copy that overflows. */
export const CARD_DESCRIPTION_MAX_LENGTH = 200

/**
 * Resources and Tutorials are the same shape of document with different homes
 * in the nav, so they share one field definition. They were a single collection
 * split by a `type` select until 2026-07-28; separate collections keep the
 * admin nav honest about what a member is actually creating.
 */
export function buildLearningFields({ noun }: { noun: string }): Field[] {
  return [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'title',
              label: `${noun} Title`,
              type: 'text',
              required: true,
              admin: {
                placeholder: 'e.g., Raspberry Pi Setup Guide',
              },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description:
                  'URL-friendly version (auto-generated from title, but you can edit it)',
                placeholder: 'Will auto-generate when you type the title',
              },
            },
            {
              name: 'description',
              label: 'Short Description',
              type: 'textarea',
              required: true,
              maxLength: CARD_DESCRIPTION_MAX_LENGTH,
              admin: {
                description: `One-line summary shown in cards and previews (max ${CARD_DESCRIPTION_MAX_LENGTH} characters)`,
              },
            },
            {
              name: 'thumbnail',
              label: 'Thumbnail Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Image displayed in cards',
              },
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'difficulty',
              type: 'select',
              required: true,
              options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ],
              defaultValue: 'beginner',
              admin: {
                description: `Difficulty level for this ${noun.toLowerCase()}`,
              },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              required: false,
              admin: {
                description: 'Categorize with tags (Python, React, Backend, etc.)',
              },
            },
            {
              name: 'estimatedReadTime',
              label: 'Estimated Read Time (minutes)',
              type: 'number',
              required: false,
              min: 1,
              max: 999,
              admin: {
                description: `Approximate time to complete this ${noun.toLowerCase()}`,
                placeholder: '30',
              },
            },
            {
              name: 'badge',
              type: 'select',
              required: false,
              options: [
                { label: 'Featured', value: 'featured' },
                { label: 'Popular', value: 'popular' },
                { label: 'Essential', value: 'essential' },
                { label: 'Coming Soon', value: 'comingSoon' },
              ],
              admin: {
                position: 'sidebar',
                description:
                  'Optional label shown on the card. "New" is added automatically for the first 14 days. "Coming Soon" also makes the card non-clickable, for a page announced before it is written',
              },
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              required: false,
              minRows: 0,
              blocks: [
                TextBlock,
                CodeBlock,
                TableBlock,
                GraphBlock,
                ImageBlock,
                VideoBlock,
                RowBlock,
                AccordionBlock,
                SimulatorLinkBlock,
              ],
              admin: {
                description:
                  'Build the page with flexible content blocks. Add text, code, tables, images, diagrams, videos, collapsible sections, and more.',
              },
            },
          ],
        },
      ],
    },
  ]
}

/**
 * "Preview" button in the admin, opening the real published page in a new tab.
 *
 * Deliberately points at the live route rather than a draft renderer: these
 * collections have no drafts/versions, so the saved document *is* what visitors
 * see. Editors save, then preview.
 */
export function buildLearningPreview(basePath: string): CollectionConfig['admin'] {
  return {
    preview: (doc) => {
      const slug = typeof doc?.slug === 'string' ? doc.slug : null
      return slug ? `${getServerSideURL()}/${basePath}/${slug}` : null
    },
  }
}

/** Auto-fill the slug from the title the first time a doc is saved. */
export const learningHooks: CollectionConfig['hooks'] = {
  beforeValidate: [
    ({ data }) => {
      if (data?.title && !data?.slug) {
        data.slug = generateSlug(data.title)
      }
      return data
    },
  ],
}
