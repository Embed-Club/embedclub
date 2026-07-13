import type { CollectionConfig } from 'payload'

/**
 * The photo gallery. One document holds the whole masonry wall: each row is an
 * image picked from the Media library plus its own caption. No title needed —
 * the caption per image is the only text.
 */
export const Gallery: CollectionConfig = {
  slug: 'gallery',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'updatedAt'],
    description: 'Add images and give each one a caption. They render as a masonry wall.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'photos',
      label: 'Photos',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: {
        description: 'Drag to reorder. Pick each image from Media (or drag new files in).',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          admin: { description: 'What is this photo? Shown on hover.' },
        },
      ],
    },
  ],
}

export default Gallery
