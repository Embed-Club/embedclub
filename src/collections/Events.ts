import type { CollectionConfig } from 'payload'

/**
 * Generate a URL-friendly slug from text
 * Converts: "AI Workshop 2024!" -> "ai-workshop-2024"
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

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    read: () => true, // Allow anyone to read events
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Auto-generate slug from title if slug is empty
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
  },
  fields: [
    { 
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'category',
              label: 'Category',
              type: 'text',
              required: true,
              admin: {
                description: 'E.g., "Workshop", "Seminar", "Social Event"',
              },
            },
            {
              name: 'title',
              label: 'Event Title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'URL-friendly version (auto-generated from title, but you can edit it)',
                placeholder: 'Will auto-generate when you type the title',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Event Poster/Image',
              admin: {
                description: 'Main image shown in carousel and modal',
              },
            },
            {
              name: 'shortDescription',
              label: 'Short Description (Card Preview)',
              type: 'text',
              required: false,
              admin: {
                description: 'Brief tagline shown on the carousel card (optional)',
              },
            },
          ],
        },
        {
          label: 'Event Details',
          fields: [
            {
              name: 'description',
              label: 'Full Event Description',
              type: 'richText',
              required: true,
              admin: {
                description: 'Full details about the event (shown in modal popup)',
              },
            },
            {
              name: 'venue',
              type: 'group',
              label: 'Venue Details',
              fields: [
                {
                  name: 'roomName',
                  type: 'text',
                  label: 'Room/Hall Name',
                  required: false,
                  admin: { 
                    placeholder: 'e.g., Main Auditorium, Room 204',
                  },
                },
                {
                  name: 'floor',
                  type: 'text',
                  label: 'Floor',
                  required: false,
                  admin: { 
                    placeholder: 'e.g., 2nd Floor, Ground Floor',
                  },
                },
              ],
            },
            {
              name: 'contact',
              type: 'group',
              label: 'Contact Information',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  label: 'Contact Email',
                  required: false,
                  admin: { 
                    placeholder: 'events@embedclub.org',
                    description: 'Email for questions about this event',
                  },
                },
                {
                  name: 'phone',
                  type: 'text',
                  label: 'Contact Phone',
                  required: false,
                  admin: { 
                    placeholder: '+1-234-567-8900',
                    description: 'Phone number for event inquiries',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Location & Map',
          fields: [
            {
              name: 'location',
              type: 'group',
              fields: [
                {
                  name: 'address',
                  type: 'text',
                  label: 'Event Address',
                  required: false,
                  admin: { 
                    description: 'Full street address (e.g., "123 Main St, City, Country")',
                    placeholder: '123 University Ave, City, State',
                  },
                },
                {
                  name: 'coords',
                  type: 'group',
                  label: 'Map Location',
                  admin: {
                    description: 'Click on the map to pin the exact event location',
                    components: {
                      Field: '@/components/admin/LeafletLocationField',
                    },
                  },
                  fields: [
                    {
                      name: 'lat',
                      type: 'number',
                      label: 'Latitude',
                      required: false,
                    },
                    {
                      name: 'lng',
                      type: 'number',
                      label: 'Longitude',
                      required: false,
                    },
                  ],
                },
                {
                  name: 'zoom',
                  type: 'number',
                  label: 'Map Zoom Level',
                  required: false,
                  defaultValue: 17,
                  min: 1,
                  max: 18,
                  admin: { 
                    description: 'Zoom level for the embedded map (1=world view, 18=street level)',
                    step: 1,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
