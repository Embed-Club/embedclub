import type { CollectionConfig } from 'payload'

export const MemberPhoto: CollectionConfig = {
  slug: 'member-photo',
  access: { read: () => true },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: true,
      admin: { description: 'e.g., "Photo of John Doe"' },
    },
  ],
  upload: {
    staticDir: 'media/members',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'card',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'profile',
        width: 800,
        height: 800,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
}

export default MemberPhoto