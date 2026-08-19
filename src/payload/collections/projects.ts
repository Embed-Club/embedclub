import type { CollectionConfig } from 'payload'

import {
  CodeBlock,
  GraphBlock,
  ImageBlock,
  RowBlock,
  SimulatorLinkBlock,
  TableBlock,
  TextBlock,
  VideoBlock,
} from './contentBlocks'
import { CARD_DESCRIPTION_MAX_LENGTH, generateSlug } from './learningFields'

/**
 * Club projects - the builds worth showing off: competition entries, grant
 * work, and anything the club is proud of. Distinct from Resources/Tutorials
 * (reference material) and Events (things that happen on a date): a project has
 * the people who built it and links out to the code or a demo.
 *
 * There is deliberately no status field. Everything listed here is finished
 * work, so a "Completed" badge on every card said nothing.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
  },
  // Not orderable: the showcase deals its own arrangement on every page load, so
  // a drag order here would be a control that silently does nothing.
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'title',
    description: 'Member projects. The showcase arranges the cards itself.',
    defaultColumns: ['title', 'award', 'year', 'updatedAt'],
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
              // Optional on purpose: the showcase grid gives a project with no
              // photo a type-led tile instead of a broken placeholder.
              admin: { description: 'Optional. Without one the card is typeset instead.' },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            // The result is the headline on the showcase grid, so it is stored
            // in pieces rather than as a sentence inside the description.
            {
              name: 'award',
              label: 'Award / Result',
              type: 'text',
              admin: {
                placeholder: 'e.g., Winner, Second Place, KSCST Grant',
                description: 'The result, shown large on the card. Leave empty if there is none.',
              },
            },
            {
              name: 'event',
              label: 'Competition / Event',
              type: 'text',
              admin: {
                placeholder: 'e.g., ADC, Kaushal',
                description: 'Where it was won.',
              },
            },
            {
              name: 'year',
              type: 'number',
              admin: {
                placeholder: 'e.g., 2023',
                description: 'The year the project was built.',
              },
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
                VideoBlock,
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
        // Slug is read-only in the admin, so fill it here. Only when empty -
        // regenerating on every title edit would break any link already shared.
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
  },
}
