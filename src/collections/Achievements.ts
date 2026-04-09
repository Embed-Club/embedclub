import type { CollectionConfig } from 'payload'

export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'image'],
  },
  access: {
    read: () => true,
  },
  fields: [
    // Title - shown to editors in admin (used internally, not displayed on timeline)
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },

    // Summary - Rich text editor (lexical). This becomes the card text on the timeline.
    {
      name: 'summary',
      label: 'Description',
      type: 'richText',
      required: true,
    },

    // Date - required for ordering achievements (newest first)
    {
      name: 'date',
      label: 'Achievement Date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date of the achievement (newest first)',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },

    // Optional image - will appear on opposite side of text on timeline
    {
      name: 'image',
      label: 'Image (optional)',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
  ],
}

export default Achievements
