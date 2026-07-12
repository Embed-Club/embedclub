import type { CollectionConfig } from 'payload'

/**
 * Every native form submission is stored here before being forwarded to the
 * Google Form — the club's own audit trail, and the hook point for future
 * automation (e.g. AI receipt verification).
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['form', 'googleForwardStatus', 'createdAt'],
    description: 'Read-only log of website form submissions',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user), // admins only
    create: () => false, // created server-side only
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
      name: 'answers',
      type: 'json',
      required: true,
      admin: {
        description: 'Label → answer map exactly as submitted',
      },
    },
    {
      name: 'googleForwardStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Forwarded', value: 'forwarded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        description: 'Whether the answers reached the Google Form / Sheet',
      },
    },
  ],
  timestamps: true,
}
