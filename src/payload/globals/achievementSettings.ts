import type { GlobalConfig } from 'payload'

export const AchievementSettings: GlobalConfig = {
  slug: 'achievement-settings',
  label: 'Achievement Settings',
  admin: {
    group: 'Achievements',
    description: 'Configure timeline display and ordering preferences for achievements.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'sortOrder',
      label: 'Timeline Order',
      type: 'select',
      defaultValue: 'desc',
      required: true,
      options: [
        {
          label: 'Newest first (start from new date - reverse chronological)',
          value: 'desc',
        },
        {
          label: 'Oldest first (start from old date - chronological straight)',
          value: 'asc',
        },
      ],
      admin: {
        description:
          'Choose whether the achievements timeline starts from the most recent achievements (newest first) or earliest achievements (oldest first).',
      },
    },
  ],
}
