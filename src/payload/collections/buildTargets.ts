import type { CollectionConfig } from 'payload'

import { CARD_DESCRIPTION_MAX_LENGTH, generateSlug } from './learningFields'

/**
 * Boards students can program from the browser on the Build page - one card
 * per target, each opening an in-page editor that flashes the board over USB.
 *
 * The editor itself is code, not content: each `editor` value maps to a React
 * component in `components/features/build/`. Adding a board means one doc here
 * and (if it needs a new toolchain) one new option + component.
 */
export const BuildTargets: CollectionConfig = {
  slug: 'build-targets',
  access: {
    read: () => true,
  },
  orderable: true,
  admin: {
    useAsTitle: 'title',
    description:
      'Boards programmable from the Build page. Drag rows to set the order they appear on the site.',
    defaultColumns: ['title', 'editor', 'difficulty', 'updatedAt'],
    group: 'Build',
  },
  fields: [
    {
      name: 'title',
      label: 'Board',
      type: 'text',
      required: true,
      admin: { placeholder: 'e.g., micro:bit' },
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
        description: `Shown on the card and at the top of the page (max ${CARD_DESCRIPTION_MAX_LENGTH} characters)`,
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'editor',
      type: 'select',
      required: true,
      defaultValue: 'microbitPython',
      options: [{ label: 'micro:bit (blocks + MicroPython)', value: 'microbitPython' }],
      admin: {
        description: 'Which in-browser editor the page embeds. New boards need a new option here.',
      },
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
      name: 'notes',
      label: 'Before you start',
      type: 'richText',
      admin: {
        description:
          'Optional - shown above the editor. Firmware updates, cable tips, which browser to use.',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
  },
}
