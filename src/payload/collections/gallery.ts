import type { CollectionConfig } from 'payload'

/**
 * Gallery albums. Instead of owning its own uploads, each doc picks any number
 * of images from the shared Media library — so photos can be bulk-selected
 * (and reused across events, achievements, etc.) without re-uploading.
 */
export const Gallery: CollectionConfig = {
  slug: 'gallery',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'images', 'updatedAt'],
    description: 'Pick images from the Media library — multiple at once is supported.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      admin: {
        description: 'Album/batch name, e.g. "RC Car Expo 2025"',
      },
    },
    {
      name: 'images',
      label: 'Images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description:
          'Select from the Media library — you can pick many at once, or drag new files in to upload them to Media.',
      },
    },
  ],
}

export default Gallery
