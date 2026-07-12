import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'About Embed Club',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Everything shown on the About page. Edit freely — no code changes needed.',
      },
    },
  ],
}
