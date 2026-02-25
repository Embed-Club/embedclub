import type { CollectionConfig } from 'payload'

/**
 * Generate a URL-friendly slug from text
 * Converts: "Web Development" -> "web-development"
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
}

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    read: () => true, // Public can read tags
  },
  admin: {
    useAsTitle: 'name',
    description: 'Resource tags for categorization and filtering',
  },
  fields: [
    {
      name: 'name',
      label: 'Tag Name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g., JavaScript, React, Backend',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version (auto-generated from name, but you can edit it)',
        placeholder: 'Will auto-generate when you type the name',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Auto-generate slug from name if slug is empty
        if (data?.name && !data?.slug) {
          data.slug = generateSlug(data.name)
        }
        return data
      },
    ],
  },
}
