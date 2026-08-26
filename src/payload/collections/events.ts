import type { CollectionConfig } from 'payload'

import { CARD_DESCRIPTION_MAX_LENGTH } from './learningFields'

/**
 * Generate a URL-friendly slug from text
 * Converts: "AI Workshop 2024!" -> "ai-workshop-2024"
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    read: () => true, // Allow anyone to read events
  },
  admin: {
    useAsTitle: 'title',
    group: 'Events',
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
                description:
                  'Auto-generates from the title. Enter your own if it clashes with another event.',
                placeholder: 'Will auto-generate when you type the title',
              },
            },
            {
              name: 'eventDate',
              label: 'Event Date & Time',
              type: 'date',
              required: true,
              admin: {
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'MMM d, yyyy h:mm a' },
                description: 'When the event happens. Recent events get a NEW badge.',
              },
            },
            {
              name: 'eventMode',
              label: 'Event Mode',
              type: 'select',
              required: true,
              defaultValue: 'inPerson',
              options: [
                { label: 'In-person', value: 'inPerson' },
                { label: 'Online', value: 'online' },
              ],
              admin: {
                description: 'Online events show a meeting link instead of a venue.',
              },
            },
            {
              name: 'meetingLink',
              label: 'Meeting Link',
              type: 'text',
              admin: {
                condition: (data) => data?.eventMode === 'online',
                description: 'Link attendees join the event through.',
              },
            },
            {
              // Read-only view of the forms that point *here*. The link is set
              // on the form (Forms → Related Event), because an event exists
              // long before its registration or feedback form does - pointing
              // the other way meant coming back to edit the event afterwards.
              name: 'forms',
              type: 'join',
              collection: 'forms',
              on: 'relatedEvent',
              admin: {
                description: 'Forms attached to this event. Set the link from the form, not here.',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Event Poster/Image',
              admin: {
                description: 'Poster shown on the event card.',
              },
            },
            {
              name: 'shortDescription',
              label: 'Short Description (Card Preview)',
              type: 'text',
              required: false,
              maxLength: CARD_DESCRIPTION_MAX_LENGTH,
              admin: {
                description: `Short tagline shown on the event card (max ${CARD_DESCRIPTION_MAX_LENGTH} characters).`,
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
                description: 'Full details, shown when the event card is opened.',
              },
            },
            {
              name: 'venue',
              type: 'group',
              label: 'Venue Details',
              admin: {
                condition: (data) => data?.eventMode !== 'online',
              },
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
              admin: {
                condition: (data) => data?.eventMode !== 'online',
              },
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
                      Field: '@/components/admin/leafletLocationField',
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
