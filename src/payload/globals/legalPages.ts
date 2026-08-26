import type { Block, GlobalConfig } from 'payload'

/**
 * The section blocks offered under both the privacy policy and the terms.
 *
 * Same editing shape as the About page - an intro rich-text field, then an
 * ordered list of sections below it - but only the two blocks a policy
 * document has any use for. No banner panel and no images: a legal page is
 * headings and prose, and offering a hero box here would only invite one.
 *
 * A factory rather than a shared constant because Payload keys block tables off
 * the field they hang from, and privacy and terms each need their own.
 * Exported: the Support & Contact global (`supportPages.ts`) uses the same two
 * block types for its sections.
 */
export function legalSectionBlocks(): Block[] {
  return [
    {
      slug: 'legalHeadingBlock',
      labels: { singular: 'Heading', plural: 'Headings' },
      fields: [{ name: 'heading', type: 'text', required: true }],
    },
    {
      slug: 'legalTextBlock',
      labels: { singular: 'Text Section', plural: 'Text Sections' },
      fields: [{ name: 'text', type: 'richText', required: true }],
    },
  ]
}

/**
 * The privacy policy and terms, plus the consent line printed beside the
 * tick-box on every form.
 *
 * These are one global rather than two because they are written, reviewed and
 * dated together - a policy whose "last updated" disagrees with the terms it
 * ships alongside is worse than no date at all.
 *
 * The wording is content, not code (AGENTS.md §3): members change the retention
 * period or the contact address here, not in a deploy. `scripts/seedLegalPages.ts`
 * writes the first version.
 */
export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  label: 'Legal Pages',
  admin: {
    group: 'Site & Legal',
    description: 'Privacy policy, terms, and the consent line shown on forms.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'privacyTitle',
      type: 'text',
      defaultValue: 'Privacy Policy',
      required: true,
    },
    {
      name: 'privacy',
      type: 'richText',
      admin: {
        description: 'Intro text at the top of /privacy, shown before the sections below.',
      },
    },
    {
      name: 'privacySections',
      type: 'blocks',
      admin: {
        description: 'Sections shown below the intro on /privacy. Drag to reorder.',
      },
      blocks: legalSectionBlocks(),
    },
    {
      name: 'termsTitle',
      type: 'text',
      defaultValue: 'Terms & Conditions',
      required: true,
    },
    {
      name: 'terms',
      type: 'richText',
      admin: {
        description: 'Intro text at the top of /terms, shown before the sections below.',
      },
    },
    {
      name: 'termsSections',
      type: 'blocks',
      admin: {
        description: 'Sections shown below the intro on /terms. Drag to reorder.',
      },
      blocks: legalSectionBlocks(),
    },
    {
      /**
       * Deliberately plain text, not rich text: it sits inside a checkbox label
       * on the form, where a heading or an image would have nowhere to go.
       */
      name: 'consentNotice',
      type: 'textarea',
      admin: {
        description:
          'The sentence beside the consent tick-box on every form. Say what the details are used for - this is the notice, and the policy is the detail behind it. A link to the Privacy Policy is added to the end, so finish with something that leads into it ("… See the").',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Shown at the top of both pages.',
      },
    },
  ],
}
