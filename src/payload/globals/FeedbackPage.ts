import type { GlobalConfig } from 'payload'

export const FeedbackPage: GlobalConfig = {
  slug: 'feedback-page',
  label: 'Feedback Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Feedback',
      required: true,
    },
    {
      name: 'intro',
      type: 'richText',
      admin: {
        description:
          'Optional intro shown above the list of feedback forms. The list itself comes from the Feedback Forms collection.',
      },
    },
  ],
}
