import { rewriteUploadUrls } from '@/lib/mediaUrl'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    // Serve media from the Supabase public CDN (see NEXT_PUBLIC_SUPABASE_MEDIA_URL).
    afterRead: [rewriteUploadUrls],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
  },
}
