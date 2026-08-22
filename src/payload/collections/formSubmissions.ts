import type { CollectionConfig } from 'payload'

/**
 * Every response to a native form. This is the club's record of who signed up
 * or gave feedback - not a log of something stored elsewhere, so it is never
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
    hidden: true,
    defaultColumns: ['submitterName', 'submitterEmail', 'form', 'certificateStatus', 'createdAt'],
    description: 'Responses submitted through the website.',
    group: 'Forms',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user), // admins only
    create: () => false, // written server-side by the submit action
    // members need to set the per-person certificate values - a placing is
    // known only after the event, and only to them. The record of what the
    // respondent actually said stays locked: the fields below carrying it deny
    // update individually, so this opens the certificate columns and nothing
    // else. Field access is enforced by Payload, unlike `admin.readOnly`,
    // which only hides the input.
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      index: true,
      access: { update: () => false },
      admin: {
        description:
          'The form this response came from. It is cleared if that form is deleted so the response audit record remains.',
      },
    },
    {
      name: 'submitterName',
      type: 'text',
      index: true,
      access: { update: () => false },
      admin: {
        description: 'Taken from the question marked as the name. Printed on certificates.',
      },
    },
    {
      name: 'submitterEmail',
      type: 'text',
      index: true,
      access: { update: () => false },
      admin: {
        description: 'Taken from the question marked as the email. Certificates are sent here.',
      },
    },
    {
      name: 'answers',
      type: 'json',
      required: true,
      access: { update: () => false },
      admin: {
        description: 'Field id → answer. Stable across question renames.',
      },
    },
    {
      name: 'answersByLabel',
      type: 'json',
      access: { update: () => false },
      admin: {
        description: 'The same answers against the question wording as it was at submit time.',
        readOnly: true,
      },
    },
    {
      name: 'attachments',
      type: 'array',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Photos this person attached. Stored in the form’s Google Drive folder.',
        components: {
          RowLabel: '@/components/admin/formAttachmentRowLabel',
        },
      },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'fieldId', type: 'text' },
        { name: 'driveFileId', type: 'text' },
        { name: 'fileName', type: 'text' },
        { name: 'mimeType', type: 'text' },
        {
          name: 'preview',
          type: 'ui',
          admin: {
            components: {
              Field: '@/components/admin/formAttachmentPreview',
            },
          },
        },
      ],
    },
    {
      /**
       * When this person ticked the consent box. Stamped server-side at submit
       * time, never taken from the client - the point of the record is that it
       * cannot be back-dated, and `update: false` keeps a member from moving
       * it afterwards.
       *
       * Empty on the rows imported from the Google Forms archive in 2026-08:
       * consent for those was given on Google's form, not this one, and writing
       * a stamp here would claim otherwise.
       */
      name: 'consentAcceptedAt',
      label: 'Consent Given At',
      type: 'date',
      access: { update: () => false },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When this person agreed to the privacy notice. Empty for imported rows.',
      },
    },
    {
      /**
       * Values a member sets for this one person, for certificate markers the
       * form itself cannot answer.
       *
       * A placing is the case: the winner cannot be asked to declare themselves
       * on a feedback form, and a value fixed on the form would print "1st" on
       * every certificate. So it is recorded here, against the person, after
       * the event - the only point at which anyone knows it.
       *
       * Deliberately free-form rather than a list of the markers the form
       * declares: this is edited one submission at a time, and a marker renamed
       * on the form would otherwise silently empty every value already typed.
       * The form's Certificate Fields say which markers are expected.
       */
      name: 'certificateValues',
      label: 'Certificate Values (set by a member)',
      type: 'array',
      admin: {
        description:
          'Values printed on this person’s certificate. Unset ones use the form default.',
        components: {
          RowLabel: '@/components/admin/certificateValueRowLabel',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              label: 'Marker',
              type: 'text',
              required: true,
              admin: {
                width: '40%',
                description: 'Without the braces - for {{Place}} write Place.',
                placeholder: 'Place',
              },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: { width: '60%', placeholder: '1st' },
            },
          ],
        },
      ],
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
      // Which Google response this row came from, for the archive imported in
      // 2026-08. It is what lets the import resume after a partial failure
      // without writing every response a second time.
      name: 'googleResponseId',
      type: 'text',
      index: true,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Set by the import script. Empty for responses submitted through the site.',
      },
    },
    {
      name: 'sheetSyncedAt',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When this row was copied to the Google Sheet. Empty means not synced.',
      },
    },
  ],
  timestamps: true,
}
