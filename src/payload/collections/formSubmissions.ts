import type { CollectionConfig } from 'payload'

/**
 * Every response to a native form. This is the club's record of who signed up
 * or gave feedback — not a log of something stored elsewhere, so it is never
 * safe to clear out (see AGENTS.md §3).
 *
 * `answers` is keyed by each form field's Payload row `id`, which survives
 * label edits. `answersByLabel` is a denormalised copy written at submit time
 * purely so the admin list and CSV export stay readable years later, when the
 * question wording may well have changed.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'submitterName',
    defaultColumns: ['submitterName', 'submitterEmail', 'form', 'certificateStatus', 'createdAt'],
    description: 'Responses submitted through the website.',
    group: 'Forms',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user), // admins only
    create: () => false, // written server-side by the submit action
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      index: true,
    },
    {
      name: 'submitterName',
      type: 'text',
      index: true,
      admin: {
        description: 'Taken from the question marked as the name. Printed on certificates.',
      },
    },
    {
      name: 'submitterEmail',
      type: 'text',
      index: true,
      admin: {
        description: 'Taken from the question marked as the email. Certificates are sent here.',
      },
    },
    {
      name: 'answers',
      type: 'json',
      required: true,
      admin: {
        description: 'Field id → answer. Stable across question renames.',
      },
    },
    {
      name: 'answersByLabel',
      type: 'json',
      admin: {
        description: 'The same answers against the question wording as it was at submit time.',
        readOnly: true,
      },
    },
    {
      name: 'certificateStatus',
      type: 'select',
      required: true,
      defaultValue: 'notApplicable',
      options: [
        { label: 'Not applicable', value: 'notApplicable' },
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      index: true,
      admin: {
        description: 'Whether this person has been sent their certificate.',
      },
    },
    {
      name: 'certificateSentAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'certificateError',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Why the last send attempt failed, if it did.',
      },
    },
    {
      name: 'sheetSyncedAt',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'When this row reached the optional Google Sheet mirror. Empty means not synced (or Sheets is not configured).',
      },
    },
  ],
  timestamps: true,
}
