import { rewriteUploadUrls } from '@/lib/mediaUrl'
import { findMediaUsage } from '@/payload/hooks/mediaUsage'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Library & System',
    description: 'Every image used across the site. Drag files in to upload in bulk.',
    components: {
      views: {
        list: {
          Component: '@/components/admin/mediaListView',
        },
      },
    },
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Serve media from the Supabase public CDN (see NEXT_PUBLIC_SUPABASE_MEDIA_URL).
    afterRead: [rewriteUploadUrls],
  },
  endpoints: [
    {
      path: '/usage',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            { errors: [{ message: 'You must be signed in to inspect media usage.' }] },
            { status: 401 },
          )
        }

        const ids = new URL(req.url || '', 'http://payload.local').searchParams
          .getAll('id')
          .flatMap((value) => value.split(','))
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)

        return Response.json({ usage: await findMediaUsage(ids, req) })
      },
    },
  ],
  fields: [
    {
      // No column: a button that opens the bulk drawer from "Create New".
      name: 'bulkUpload',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/mediaBulkUploadButton',
        },
      },
    },
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
