import type { CollectionConfig } from 'payload'

/**
 * Native form builder. Organizers recreate a Google Form's fields here
 * (mirroring each field's `entry.<id>` from the Form's pre-filled link);
 * the website renders a multi-step wizard, stores every submission in
 * `form-submissions`, and forwards the answers to the Google Form so the
 * linked Sheet stays the organizers' source of truth.
 */
export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'active', 'deadline', 'updatedAt'],
    description:
      'Forms shown on the website. Answers are saved here and forwarded to the linked Google Form.',
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'registration',
      options: [
        { label: 'Event Registration', value: 'registration' },
        { label: 'Feedback', value: 'feedback' },
        { label: 'General', value: 'general' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive forms show a closed message instead of the form',
      },
    },
    {
      name: 'deadline',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Optional — the form closes automatically after this time',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Shown under the form title',
      },
    },
    {
      name: 'googleFormUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'The Google Form link (viewform URL). Submissions are forwarded to it so responses appear in the linked Sheet.',
      },
    },
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      required: true,
      admin: {
        description: 'Each step is one screen of the wizard',
      },
      fields: [
        {
          name: 'stepTitle',
          type: 'text',
          required: true,
          admin: { placeholder: 'e.g. Personal Details' },
        },
        {
          name: 'stepDescription',
          type: 'text',
          admin: { placeholder: 'e.g. Tell us who you are' },
        },
        {
          name: 'fields',
          type: 'array',
          minRows: 1,
          required: true,
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'fieldType',
                  type: 'select',
                  required: true,
                  defaultValue: 'text',
                  options: [
                    { label: 'Short Text', value: 'text' },
                    { label: 'Email', value: 'email' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'Number', value: 'number' },
                    { label: 'Paragraph', value: 'textarea' },
                    { label: 'Dropdown', value: 'select' },
                    { label: 'Multiple Choice (one answer)', value: 'radio' },
                    { label: 'Checkboxes (many answers)', value: 'checkbox' },
                    { label: 'Date', value: 'date' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'required',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'width',
                  type: 'select',
                  defaultValue: 'full',
                  options: [
                    { label: 'Full width', value: 'full' },
                    { label: 'Half width', value: 'half' },
                  ],
                  admin: {
                    description: 'Half-width fields pair up side by side on desktop',
                  },
                },
              ],
            },
            {
              name: 'placeholder',
              type: 'text',
            },
            {
              name: 'options',
              type: 'array',
              admin: {
                condition: (_data, siblingData) =>
                  ['select', 'radio', 'checkbox'].includes(siblingData?.fieldType),
                description: 'Choices — must match the Google Form options exactly',
              },
              fields: [
                {
                  name: 'option',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'googleEntryId',
              type: 'text',
              required: true,
              admin: {
                description:
                  'From the Google Form pre-filled link, e.g. entry.123456789 (digits alone also work)',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'confirmationMessage',
      type: 'textarea',
      defaultValue: 'Your response has been recorded. Thank you!',
    },
    {
      name: 'showCertificate',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Offer a certificate download after submitting (feedback forms)',
      },
    },
    {
      name: 'certificateTemplate',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data.showCertificate,
        description: 'Background image/PDF for the generated certificate',
      },
    },
    {
      name: 'certificateConfig',
      type: 'group',
      admin: {
        condition: (data) => data.showCertificate,
      },
      fields: [
        { name: 'nameX', type: 'number', defaultValue: 400 },
        { name: 'nameY', type: 'number', defaultValue: 300 },
        { name: 'fontSize', type: 'number', defaultValue: 40 },
        { name: 'color', type: 'text', defaultValue: '#000000' },
      ],
    },
  ],
}
