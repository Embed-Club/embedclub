import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About Page',
  admin: { group: 'Pages' },
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
        description:
          'Intro text shown at the top of the page (rendered before the sections below).',
      },
    },
    {
      name: 'sections',
      type: 'blocks',
      admin: {
        description: 'Extra sections shown below the intro. Drag to reorder.',
      },
      blocks: [
        {
          slug: 'bannerBlock',
          labels: { singular: 'Banner Heading', plural: 'Banner Headings' },
          fields: [
            { name: 'heading', type: 'text', required: true },
            {
              name: 'subheading',
              type: 'text',
            },
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional image behind the heading' },
            },
          ],
        },
        {
          slug: 'aboutTextBlock',
          labels: { singular: 'Text Section', plural: 'Text Sections' },
          fields: [{ name: 'text', type: 'richText', required: true }],
        },
        {
          slug: 'aboutImageBlock',
          labels: { singular: 'Image', plural: 'Images' },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            { name: 'caption', type: 'text' },
            {
              name: 'position',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Center (full width)', value: 'center' },
                { label: 'Float left (text wraps right)', value: 'left' },
                { label: 'Float right (text wraps left)', value: 'right' },
              ],
            },
            {
              name: 'size',
              type: 'select',
              defaultValue: 'large',
              options: [
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
