import { USN_FORMAT_HINT } from '@/lib/usn'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { generateSlug } from './learningFields'

type FieldRow = {
  role?: string | null
  fieldType?: string | null
  label?: string | null
  displayImage?: unknown
}
type StepRow = {
  fields?: FieldRow[] | null
  stepTitle?: string | null
  stepImage?: unknown
}

/**
 * Field types that hold no typed answer, so they can never be the question
 * that supplies a name or an email address for a certificate.
 */
const ROLELESS_TYPES = ['image', 'imageUpload']

/** Count how many questions across the whole form carry a given role. */
function countRole(steps: StepRow[] | null | undefined, role: string): number {
  let n = 0
  for (const step of steps ?? []) {
    for (const field of step.fields ?? []) {
      if (ROLELESS_TYPES.includes(field.fieldType ?? '')) continue
      if (field.role === role) n += 1
    }
  }
  return n
}

/** Steps that would render as a blank screen - no questions and no image. */
function emptySteps(steps: StepRow[] | null | undefined): string[] {
  const empty: string[] = []
  for (const [i, step] of (steps ?? []).entries()) {
    if ((step.fields?.length ?? 0) === 0 && !step.stepImage) {
      empty.push(step.stepTitle || `Step ${i + 1}`)
    }
  }
  return empty
}

/** Every standalone image row must actually carry an image. */
function imageRowsWithoutPicture(steps: StepRow[] | null | undefined): string[] {
  const missing: string[] = []
  for (const step of steps ?? []) {
    for (const field of step.fields ?? []) {
      if (field.fieldType === 'image' && !field.displayImage) {
        missing.push(field.label || 'Untitled')
      }
    }
  }
  return missing
}

/**
 * Native form builder. members author the form here and it is rendered as a
 * multi-step wizard on the site; answers are stored in `form-submissions`,
 * which is the club's record - there is no Google Form behind it.
 */
export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'relatedEvent', 'active', 'deadline'],
    description: 'Forms shown on the website. Answers are stored under Form Submissions.',
    group: 'Forms',
  },
  access: {
    read: () => true,
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // --- SIDEBAR SETTINGS ---
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description:
          'Auto-generates from the title. Enter your own if it clashes with another form.',
        placeholder: 'Will auto-generate when you type the title',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'registration',
      options: [
        { label: 'Event Registration', value: 'registration' },
        { label: 'Feedback', value: 'feedback' },
        { label: 'General', value: 'general' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        position: 'sidebar',
        description:
          'The event this form belongs to. The event page then links to it automatically.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive forms show a closed message instead of the form',
      },
    },
    {
      name: 'sectionGroup',
      label: 'Answered separately by sections',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'The questions below are shared by every section, but responses are kept separate.',
      },
    },
    {
      name: 'sectionOf',
      label: 'Section of',
      type: 'relationship',
      relationTo: 'forms',
      index: true,
      filterOptions: () => ({ sectionGroup: { equals: true } }),
      admin: {
        position: 'sidebar',
        condition: (data) => !data?.sectionGroup,
        description: 'Leave empty for a normal, standalone form.',
      },
    },
    {
      name: 'sectionLabel',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.sectionOf),
        description: 'What this section is called - e.g. A Section, or Day 1.',
      },
    },
    {
      name: 'sectionSlug',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.sectionOf),
        description: 'Generated from the section label. Used in the URL.',
      },
    },
    {
      name: 'googleFormId',
      label: 'Imported from Google Form',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set by the import script. Empty for forms authored here.',
      },
    },
    {
      name: 'sectionOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.sectionOf),
        description: 'Lowest first. Sections without one fall back to their title.',
      },
    },
    {
      name: 'deadline',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Optional - the form closes automatically after this time',
      },
    },

    // --- MAIN CONTENT TABS ---
    {
      type: 'tabs',
      tabs: [
        // ---------------- TAB 1: BASIC INFORMATION ----------------
        {
          label: 'Basic Info',
          description: 'Basic form information, description, and banner',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Shown under the form title',
              },
            },
            {
              name: 'headerImage',
              type: 'upload',
              relationTo: 'form-media',
              admin: {
                description: 'Optional banner shown once, under the form title.',
              },
            },
          ],
        },

        // ---------------- TAB 2: FORM QUESTIONS & BUILDER ----------------
        {
          label: 'Form Builder',
          description: 'Questions, wizard steps, and Google Sheets sync',
          fields: [
            {
              name: 'googleFormImport',
              type: 'ui',
              admin: {
                condition: (data) => !data?.sectionOf,
                components: {
                  Field: '@/components/admin/googleFormImporter',
                },
              },
            },
            {
              name: 'steps',
              type: 'array',
              admin: {
                condition: (data) => !data?.sectionOf,
                description:
                  'Each step is one screen the person fills in before moving to the next. Group related questions together and add a step for each group.',
              },
              fields: [
                {
                  name: 'stepTitle',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'e.g. Personal Details' },
                },
                {
                  name: 'stepDescription',
                  type: 'text',
                  admin: {
                    placeholder: 'e.g. Enter your personal details',
                    description:
                      'One line shown under the step title, telling the person what this screen is asking for.',
                  },
                },
                {
                  name: 'stepImage',
                  type: 'upload',
                  relationTo: 'form-media',
                  admin: {
                    description:
                      'Optional image shown at the top of this step, under its description.',
                  },
                },
                {
                  name: 'fields',
                  type: 'array',
                  admin: {
                    description:
                      'The questions on this step. A step with no questions is allowed if it has an image - use one to show a poster or a QR code.',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                        },
                        {
                          name: 'fieldType',
                          type: 'select',
                          required: true,
                          defaultValue: 'text',
                          options: [
                            { label: 'Short Text', value: 'text' },
                            { label: 'Email', value: 'email' },
                            { label: 'Phone', value: 'phone' },
                            { label: 'Number', value: 'number' },
                            { label: 'Paragraph', value: 'textarea' },
                            { label: 'Dropdown', value: 'select' },
                            { label: 'Multiple Choice (one answer)', value: 'radio' },
                            { label: 'Checkboxes (many answers)', value: 'checkbox' },
                            { label: 'Date', value: 'date' },
                            {
                              label: 'Image Upload (respondent attaches a photo)',
                              value: 'imageUpload',
                            },
                            {
                              label: 'Image (no answer - just shows a picture)',
                              value: 'image',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'role',
                      type: 'select',
                      defaultValue: 'none',
                      options: [
                        { label: 'Just an answer', value: 'none' },
                        { label: 'Name - printed on certificates', value: 'name' },
                        {
                          label: 'Email - where certificates are sent',
                          value: 'email',
                        },
                        {
                          label: `USN - sorted in the responses sheet (${USN_FORMAT_HINT})`,
                          value: 'usn',
                        },
                      ],
                      admin: {
                        condition: (_data, siblingData) =>
                          !ROLELESS_TYPES.includes(siblingData?.fieldType),
                        description:
                          'Tells the club what this answer is, so it can be used automatically. Name and email are used for certificates. USN is format-checked.',
                      },
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'required',
                          type: 'checkbox',
                          defaultValue: false,
                          admin: {
                            condition: (_data, siblingData) => siblingData?.fieldType !== 'image',
                          },
                        },
                        {
                          name: 'width',
                          type: 'select',
                          defaultValue: 'full',
                          options: [
                            { label: 'Full width', value: 'full' },
                            { label: 'Half width', value: 'half' },
                          ],
                          admin: {
                            description: 'Half-width fields pair up side by side on desktop',
                          },
                        },
                      ],
                    },
                    {
                      name: 'placeholder',
                      type: 'text',
                      admin: {
                        condition: (_data, siblingData) =>
                          !['image', 'imageUpload'].includes(siblingData?.fieldType),
                      },
                    },
                    {
                      name: 'helpText',
                      type: 'text',
                      admin: {
                        description: 'Optional hint shown under the field',
                      },
                    },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'form-media',
                      admin: {
                        condition: (_data, siblingData) => siblingData?.fieldType !== 'image',
                        description: 'Optional picture shown under this question’s label.',
                      },
                    },
                    {
                      name: 'displayImage',
                      type: 'upload',
                      relationTo: 'form-media',
                      admin: {
                        condition: (_data, siblingData) => siblingData?.fieldType === 'image',
                        description: 'The picture to show. The label above is used as its caption.',
                      },
                    },
                    {
                      name: 'options',
                      type: 'array',
                      admin: {
                        condition: (_data, siblingData) =>
                          ['select', 'radio', 'checkbox'].includes(siblingData?.fieldType),
                        description: 'Choices offered for this question',
                      },
                      fields: [
                        {
                          name: 'option',
                          type: 'text',
                          required: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'confirmationMessage',
              type: 'textarea',
              defaultValue: 'Your response has been recorded. Thank you!',
            },
            {
              name: 'sheetId',
              label: 'Google Sheet URL / ID',
              type: 'text',
              admin: {
                description:
                  'Optional. Paste a Sheet URL to mirror responses there. Share it with the service account as an Editor first.',
              },
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    if (typeof value !== 'string') return value
                    const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
                    return match ? match[1] : value.trim()
                  },
                ],
              },
            },
            {
              name: 'driveFolderId',
              label: 'Google Drive Folder URL / ID',
              type: 'text',
              admin: {
                description: 'Google Drive folder for attachments. Leave empty to use the default.',
              },
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    if (typeof value !== 'string') return value
                    const match = value.match(/\/folders\/([a-zA-Z0-9-_]+)/)
                    return match ? match[1] : value.trim()
                  },
                ],
              },
            },
          ],
        },

        // ---------------- TAB 3: CERTIFICATES ----------------
        {
          label: 'Certificates',
          description: 'Automated certificate delivery, Slides template, and field mappings',
          fields: [
            {
              name: 'showCertificate',
              label: 'Give respondents a certificate',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Enable automated certificate generation for this form',
              },
            },
            {
              name: 'certificateTemplateDriveId',
              label: 'Certificate Template (Google Slides URL)',
              type: 'text',
              admin: {
                condition: (data) => data.showCertificate,
                description:
                  'Google Slides link for the certificate. The slide must contain {{name}}.',
              },
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    if (typeof value !== 'string') return value
                    const match = value.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
                    return match ? match[1] : value.trim()
                  },
                ],
              },
            },
            {
              name: 'certificatePlaceholderScan',
              type: 'ui',
              admin: {
                condition: (data) => data.showCertificate,
                components: {
                  Field: '@/components/admin/certificatePlaceholderScanner',
                },
              },
            },
            {
              name: 'certificateDelivery',
              type: 'select',
              defaultValue: 'immediate',
              options: [
                { label: 'Straight after they submit', value: 'immediate' },
                { label: 'Email everyone at a set time', value: 'scheduled' },
              ],
              admin: {
                condition: (data) => data.showCertificate,
                description:
                  'Immediate sends on submit. Scheduled sends at the time you set below.',
              },
            },
            {
              name: 'certificateSendAt',
              type: 'date',
              admin: {
                condition: (data) =>
                  data.showCertificate && data.certificateDelivery === 'scheduled',
                date: { pickerAppearance: 'dayAndTime' },
                description:
                  'Default send time. Anyone not matched by a batch below goes out at this time.',
              },
            },
            {
              name: 'certificateBatches',
              type: 'array',
              admin: {
                condition: (data) =>
                  data.showCertificate && data.certificateDelivery === 'scheduled',
                description:
                  'Optional. Send different groups at different times, matched on one question.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { placeholder: 'e.g. Section B', width: '33%' },
                    },
                    {
                      name: 'matchField',
                      label: 'Question',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Exact wording of the question that identifies the group',
                        placeholder: 'e.g. Which section are you in?',
                        width: '34%',
                      },
                    },
                    {
                      name: 'matchValue',
                      label: 'Answer',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'The answer that puts someone in this batch',
                        placeholder: 'e.g. Section B',
                        width: '33%',
                      },
                    },
                  ],
                },
                {
                  name: 'sendAt',
                  type: 'date',
                  required: true,
                  admin: { date: { pickerAppearance: 'dayAndTime' } },
                },
              ],
            },
            {
              type: 'row',
              admin: { condition: (data) => data.showCertificate },
              fields: [
                {
                  name: 'certificateNameCase',
                  label: 'Name on Certificate',
                  type: 'select',
                  defaultValue: 'asTyped',
                  options: [
                    { label: 'As typed', value: 'asTyped' },
                    { label: 'UPPERCASE', value: 'upper' },
                    { label: 'Title Case', value: 'title' },
                  ],
                  admin: {
                    width: '50%',
                    description:
                      'How the name prints where {{name}} appears on the certificate itself',
                  },
                },
                {
                  name: 'certificateEmailNameCase',
                  label: 'Name in Email Greeting',
                  type: 'select',
                  defaultValue: 'asTyped',
                  options: [
                    { label: 'As typed', value: 'asTyped' },
                    { label: 'UPPERCASE', value: 'upper' },
                    { label: 'Title Case', value: 'title' },
                  ],
                  admin: {
                    width: '50%',
                    description:
                      'How the name reads in the email body, independent of the certificate',
                  },
                },
              ],
            },
            {
              name: 'certificateEmailSubject',
              type: 'text',
              admin: {
                condition: (data) => data.showCertificate,
                placeholder: 'Your certificate - {{event}}',
                description:
                  'Optional. {{event}} is replaced with this form’s title. Leave empty for the default subject.',
              },
            },
            {
              name: 'certificateEmailBody',
              type: 'textarea',
              admin: {
                condition: (data) => data.showCertificate,
                placeholder:
                  'Dear {{name}},\n\nThank you for attending {{event}}. Your certificate is attached.\n\nRegards,\nEmbed Club',
                description: 'Optional. {{name}} and {{event}} are filled in per person.',
              },
            },
            {
              name: 'certificateTest',
              label: 'Test Certificate',
              type: 'ui',
              admin: {
                condition: (data) => data.showCertificate,
                components: {
                  Field: '@/components/admin/certificateTestPanel',
                },
              },
            },
            {
              name: 'certificatePlaceholders',
              label: 'Certificate Fields',
              type: 'array',
              admin: {
                condition: (data) => data.showCertificate,
                description:
                  'Fills the other {{markers}} in the template. {{name}} and {{event}} are automatic.',
                components: {
                  RowLabel: '@/components/admin/certificatePlaceholderRowLabel',
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
                        description: 'Without the braces - for {{USN}} write USN.',
                        placeholder: 'USN',
                      },
                    },
                    {
                      name: 'source',
                      type: 'select',
                      required: true,
                      defaultValue: 'question',
                      options: [
                        { label: 'An answer from this form', value: 'question' },
                        { label: 'The same value for everyone', value: 'fixed' },
                        { label: 'Set per person, by a member', value: 'perPerson' },
                      ],
                      admin: { width: '60%' },
                    },
                  ],
                },
                {
                  name: 'questionLabel',
                  label: 'Question',
                  type: 'text',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.source === 'question',
                    description: 'Exact wording of the question whose answer goes here',
                    placeholder: 'e.g. USN',
                  },
                },
                {
                  name: 'fixedValue',
                  label: 'Value',
                  type: 'text',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.source === 'fixed',
                    description: 'Printed identically on every certificate for this form',
                  },
                },
                {
                  name: 'defaultValue',
                  label: 'Default',
                  type: 'text',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.source === 'perPerson',
                    description:
                      'Used when no per-person value is set. Leave empty to print nothing.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }

        if (!data?.sectionOf && (data?.steps?.length ?? 0) === 0) {
          throw new APIError('A form needs at least one step.', 400)
        }

        if (data?.sectionOf) {
          if (!data?.sectionLabel?.trim()) {
            throw new APIError('A section needs a label - e.g. A Section, or Day 1.', 400)
          }
          data.steps = []
          data.sectionSlug = generateSlug(data.sectionLabel)
        }

        const empty = emptySteps(data?.steps)
        if (empty.length > 0) {
          throw new APIError(
            `A step needs at least one question, or an image to show. Nothing on: ${empty.join(', ')}.`,
            400,
          )
        }

        const pictureless = imageRowsWithoutPicture(data?.steps)
        if (pictureless.length > 0) {
          throw new APIError(
            `Image questions need a picture. Missing on: ${pictureless.join(', ')}.`,
            400,
          )
        }

        if (data?.showCertificate) {
          const names = countRole(data.steps, 'name')
          const emails = countRole(data.steps, 'email')
          const problems: string[] = []
          if (names !== 1) {
            problems.push(`exactly one question marked as the person's name (found ${names})`)
          }
          if (emails !== 1) {
            problems.push(`exactly one question marked as the person's email (found ${emails})`)
          }
          if (problems.length > 0) {
            throw new APIError(`Certificates need ${problems.join(', and ')}.`, 400)
          }
        }

        return data
      },
    ],
  },
}
