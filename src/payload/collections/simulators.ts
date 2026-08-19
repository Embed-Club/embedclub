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

export const Simulators: CollectionConfig = {
  slug: 'simulators',
  orderable: true,
  admin: {
    useAsTitle: 'title',
    description:
      'External simulators students can launch. Drag rows to set the order they appear on the site.',
    defaultColumns: ['title', 'difficulty', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
      type: 'textarea',
      required: true,
      maxLength: CARD_DESCRIPTION_MAX_LENGTH,
      admin: {
        description: `Shown on the card and at the top of the modal (max ${CARD_DESCRIPTION_MAX_LENGTH} characters)`,
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'difficulty',
      type: 'select',
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    {
      name: 'estimatedTime',
      type: 'number',
      admin: {
        description: 'Estimated time to complete in minutes',
      },
    },
    {
      name: 'launchUrl',
      label: 'Simulator URL',
      type: 'text',
      required: true,
      admin: {
        description:
          'Where the simulator actually lives, e.g. https://wokwi.com. Students open this from the modal.',
      },
    },
    {
      name: 'videoUrl',
      label: 'Walkthrough Video URL',
      type: 'text',
      admin: {
        description: 'Optional walkthrough video. Plays inside the simulator popup.',
      },
    },
    {
      name: 'content',
      label: 'How to use',
      type: 'blocks',
      required: false,
      minRows: 0,
      admin: {
        description:
          'Optional - setup steps, login notes, download instructions. Shown under the video in the modal.',
      },
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
