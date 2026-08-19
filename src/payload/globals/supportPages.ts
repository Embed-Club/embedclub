import type { GlobalConfig } from 'payload'
import { legalSectionBlocks } from './legalPages'

/**
 * The contact page. Support used to be its own page from the same global; the
 * two were the same job split across two thin pages, so /support now redirects
 * to /contact and its answers render there as the `supportFaq` accordion. The
 * old support title/intro/sections fields went with the page.
 *
 * Contact carries two plain-text fields, `contactEmail` and `contactPhone`: a
 * contact page with no way to actually reach the club is just a text page, so
 * /contact renders them as mailto/tel cards under the intro.
 */
export const SupportPages: GlobalConfig = {
  slug: 'support-pages',
  // Slug stays `support-pages`: renaming it would be a table rename and a
  // migration for a label change nobody sees.
  label: 'Contact',
  admin: {
    group: 'Pages',
    description: 'The /contact page. /support redirects here.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'contactTitle',
      type: 'text',
      defaultValue: 'Contact',
      required: true,
    },
    {
      name: 'contactEmail',
      type: 'text',
      admin: {
        description: 'Shown as a mailto card under the /contact intro.',
      },
    },
    {
      name: 'contactPhone',
      type: 'text',
      admin: {
        description: 'Shown as a tel card under the /contact intro. Leave blank to omit.',
      },
    },
    {
      name: 'contact',
      type: 'richText',
      admin: {
        description: 'Intro text at the top of /contact, shown above the email/phone cards.',
      },
    },
    {
      name: 'supportFaq',
      type: 'array',
      label: 'Support FAQ',
      admin: {
        description:
          'Collapsible answers under the Support heading on /contact, below the email/phone cards. Drag to reorder.',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
        },
      ],
    },
    {
      name: 'contactSections',
      type: 'blocks',
      admin: {
        description: 'Sections shown below the intro on /contact. Drag to reorder.',
      },
      blocks: legalSectionBlocks(),
    },
  ],
}
