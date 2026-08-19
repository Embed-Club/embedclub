import { rewriteUploadUrls } from '@/lib/mediaUrl'
import type { CollectionConfig } from 'payload'

/**
 * The photo wall. Each document IS one uploaded photo plus its caption, which
 * is what makes bulk work possible: drag thirty files onto the list view and
 * Payload creates thirty documents, then captions get filled in afterwards.
 *
 * It used to be a single document holding an array of picks from the Media
 * library, which meant adding photos one row at a time (changed 2026-07-28).
 *
 * Upload settings mirror `media` exactly - same image sizes, same webp
 * conversion, same bucket root - so the 32 photos migrated across keep serving
 * their already-generated derivative files.
 */
export const Gallery: CollectionConfig = {
  slug: 'gallery',
  // Drag rows in the list view to set the order photos appear on the wall.
  orderable: true,
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['filename', 'caption', 'updatedAt'],
    description: 'Drag photos in to upload them in bulk, then add a caption to each.',
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Serve from the Supabase public CDN (see NEXT_PUBLIC_SUPABASE_MEDIA_URL).
    afterRead: [rewriteUploadUrls],
  },
  fields: [
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'What is this photo? Shown on hover.' },
    },
  ],
  upload: {
    staticDir: 'gallery',
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
      options: { quality: 80 },
    },
  },
}

export default Gallery
