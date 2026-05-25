import type { CollectionConfig } from 'payload'

export const FeedbackForms: CollectionConfig = {
  slug: 'feedback-forms',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'googleFormUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'The URL of the Google Form to embed',
      },
    },
    {
      name: 'certificateTemplate',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Background image for the generated certificate',
      },
    },
    {
      name: 'showCertificate',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether to show a certificate download button after submission',
      },
    },
    {
      name: 'certificateConfig',
      type: 'group',
      admin: {
        condition: (data) => data.showCertificate,
      },
      fields: [
        {
          name: 'nameX',
          type: 'number',
          defaultValue: 400,
        },
        {
          name: 'nameY',
          type: 'number',
          defaultValue: 300,
        },
        {
          name: 'fontSize',
          type: 'number',
          defaultValue: 40,
        },
        {
          name: 'color',
          type: 'text',
          defaultValue: '#000000',
        },
      ],
    },
  ],
}
