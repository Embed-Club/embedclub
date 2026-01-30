import type { CollectionConfig } from 'payload'

export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'category', 'roles', 'startYear', 'endYear'],
  },
  access: { read: () => true },
  fields: [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true },
    {
        name: 'photo',
        label: 'Photo',
        type: 'upload',
        relationTo: 'member-photo', // changed from 'media'
        required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'relationship',
      relationTo: 'member-categories', // create this collection separately
      required: true,
    },
    {
      name: 'roles',
      label: 'Roles',
      type: 'relationship',
      relationTo: 'member-roles', // create this collection separately
      hasMany: false, // set to false if you want only one role
      required: true,
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'textarea',
      required: false,
    },
    {
      name: 'startYear',
      label: 'Start Year',
      type: 'number',
      required: true,
      admin: { description: 'e.g. 2021' },
    },
    {
      name: 'endYear',
      label: 'End Year',
      type: 'number',
      required: false,
      admin: { description: 'Leave empty if still active' },
    },
    {
      name: 'github',
      label: 'GitHub Profile',
      type: 'text',
      required: false,
    },
    {
      name: 'linkedin',
      label: 'LinkedIn Profile',
      type: 'text',
      required: false,
    },
    {
      name: 'socialAccounts',
      label: 'Other Social Accounts',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'platform',
          label: 'Platform',
          type: 'select',
          options: [
            'twitter',
            'instagram',
            'facebook',
            'youtube',
            'tiktok',
            'other',
          ],
          required: false,
        },
        {
          name: 'url',
          label: 'Profile URL',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
}

export default Members