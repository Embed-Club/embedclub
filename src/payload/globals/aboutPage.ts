import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About Page',
  admin: { group: 'About' },
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
      name: 'legacyWebsiteUrl',
      type: 'text',
      label: 'Legacy Website URL (v1.0)',
      defaultValue: 'https://embedclub.org/',
      admin: {
        description:
          'URL pointing to the original website (e.g. Netlify URL once embedclub.org domain transfers).',
      },
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
    {
      name: 'currentDevelopers',
      type: 'array',
      label: 'Current Website Team (v2.0)',
      labels: { singular: 'Developer / Contributor', plural: 'Developers / Contributors' },
      admin: {
        description:
          'Developers and contributors who worked or are working on the current (v2.0) website.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text', defaultValue: 'Lead Developer' },
        { name: 'url', type: 'text', label: 'Profile / GitHub URL' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'legacyDevelopers',
      type: 'array',
      label: 'Original Website Team (v1.0)',
      labels: { singular: 'Developer / Contributor', plural: 'Developers / Contributors' },
      admin: {
        description:
          'Developers and contributors who built or added to the original (v1.0) embedclub.org website.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text', defaultValue: 'Original Developer' },
        { name: 'url', type: 'text', label: 'Profile / GitHub URL' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'heritageCommunityNote',
      type: 'textarea',
      label: 'Heritage Community Acknowledgments Note',
      defaultValue:
        'Heartfelt gratitude to all past and present Embed Club executive members, faculty mentors, workshop leads, and student authors at P.A. College of Engineering who contributed tutorials, project documentation, and photography across both generations of the website.',
    },
  ],
}
