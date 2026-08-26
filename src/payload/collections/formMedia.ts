import { rewriteUploadUrls } from '@/lib/mediaUrl'
import type { CollectionConfig } from 'payload'

/**
 * Images a member attaches while authoring a form - a payment QR, a poster,
 * a wiring diagram next to the question that asks about it.
 *
 * Kept out of `media` on purpose. `media` is the site's own art direction and
 * gets browsed as a library; form artwork is one-off, tied to a single form,
 * and would otherwise bury the real library under a pile of QR codes. Sizes
 * are smaller here too, since nothing in a form renders full-bleed.
 *
 * Files respondents *upload* do not live here at all - those go to Google
 * Drive (see `lib/googleDrive.ts`).
 */
export const FormMedia: CollectionConfig = {
  slug: 'form-media',
  labels: {
    singular: 'Form/Feedback Media',
    plural: 'Form/Feedback Media',
  },
  admin: {
    group: 'Forms',
    description: 'Images used inside forms, kept separate from the site media library.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Serve from the Supabase public CDN, same as the other upload collections.
    afterRead: [rewriteUploadUrls],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describes the image for screen readers, e.g. "UPI payment QR code".',
      },
    },
  ],
  upload: {
    staticDir: 'formMedia',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'inline',
        width: 900,
        height: undefined,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
}
