import type { CollectionConfig } from 'payload'

import {
  CodeBlock,
  GraphBlock,
  ImageBlock,
  RowBlock,
  SimulatorLinkBlock,
  TableBlock,
  TextBlock,
} from './contentBlocks'
import { CARD_DESCRIPTION_MAX_LENGTH, generateSlug } from './learningFields'

/**
 * Club projects — builds members have shipped or are working on. Distinct from
 * Resources/Tutorials (reference material) and Events (things that happen on a
 * date): a project has a status, the people who built it, and links out to the
 * code or a demo.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
  },
  orderable: true,
  admin: {
    useAsTitle: 'title',
    description: 'Member projects. Drag rows to set the order they appear on the site.',
    defaultColumns: ['title', 'status', 'updatedAt'],
    group: 'Content',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'title',
              label: 'Project Title',
              type: 'text',
              required: true,
              admin: { placeholder: 'e.g., Line Following Robot' },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'Generated from the title.',
              },
            },
            {
              name: 'description',
              label: 'Short Description',
              type: 'textarea',
              required: true,
              maxLength: CARD_DESCRIPTION_MAX_LENGTH,
              admin: {
                description: `One-line summary shown on the project card (max ${CARD_DESCRIPTION_MAX_LENGTH} characters)`,
              },
            },
            {
              name: 'thumbnail',
              label: 'Thumbnail Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Image displayed on the project card' },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'inProgress',
              options: [
                { label: 'Planned', value: 'planned' },
                { label: 'In Progress', value: 'inProgress' },
                { label: 'Completed', value: 'completed' },
              ],
              admin: { description: 'Shown as a badge on the card' },
            },
            {
              name: 'team',
              label: 'Team Members',
              type: 'relationship',
              relationTo: 'members',
              hasMany: true,
              admin: { description: 'Who built this' },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              admin: { description: 'Categorize with tags (IoT, Robotics, PCB, etc.)' },
            },
            {
              name: 'repoUrl',
              label: 'Repository URL',
              type: 'text',
              admin: { description: 'Optional link to the source code (GitHub, GitLab, …)' },
            },
            {
              name: 'demoUrl',
              label: 'Demo URL',
              type: 'text',
              admin: { description: 'Optional link to a live demo or video' },
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
                RowBlock,
                SimulatorLinkBlock,
              ],
              admin: {
                description: 'The write-up: how it works, what it took, what broke. Optional.',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Slug is read-only in the admin, so fill it here. Only when empty —
        // regenerating on every title edit would break any link already shared.
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
  },
}
