import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { generateSlug } from './learningFields'

type FieldRow = {
  role?: string | null
  fieldType?: string | null
  label?: string | null
  displayImage?: unknown
}
type StepRow = { fields?: FieldRow[] | null }

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
 * Native form builder. Officers author the form here and it is rendered as a
 * multi-step wizard on the site; answers are stored in `form-submissions`,
 * which is the club's record — there is no Google Form behind it.
 *
 * Until 2026-07-28 each field carried a hand-copied `entry.<id>` from a Google
 * Form and submissions were forwarded there. That was dropped: it was the most
 * error-prone thing an officer had to do, and Google returns 200 even when the
 * entry IDs are wrong, so a typo silently sent responses nowhere.
 *
 * Answers are keyed by each field row's Payload `id`, which is stable across
 * label edits. Renaming a question therefore no longer orphans older answers.
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
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Generated from the title.',
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
          'The event this form belongs to. Events are created first, so the link is set here — the event page then shows a button to this form automatically.',
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
      name: 'deadline',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Optional — the form closes automatically after this time',
      },
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
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      required: true,
      admin: {
        description: 'Each step is one screen of the wizard',
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
          admin: { placeholder: 'e.g. Tell us who you are' },
        },
        {
          name: 'stepImage',
          type: 'upload',
          relationTo: 'form-media',
          admin: {
            description: 'Optional image shown at the top of this step, under its description.',
          },
        },
        {
          name: 'fields',
          type: 'array',
          minRows: 1,
          required: true,
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
                    { label: 'Image Upload (respondent attaches a photo)', value: 'imageUpload' },
                    { label: 'Image (no answer — just shows a picture)', value: 'image' },
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
                { label: "The person's name", value: 'name' },
                { label: "The person's email", value: 'email' },
              ],
              admin: {
                condition: (_data, siblingData) => !ROLELESS_TYPES.includes(siblingData?.fieldType),
                description:
                  'Marks which question holds the name and which holds the email. Required for certificates — the name is printed on them and the email is where they are sent.',
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
              // Decoration attached to a question — the diagram the question is
              // about, sitting between the label and the input.
              name: 'image',
              type: 'upload',
              relationTo: 'form-media',
              admin: {
                condition: (_data, siblingData) => siblingData?.fieldType !== 'image',
                description: 'Optional picture shown under this question’s label.',
              },
            },
            {
              // The standalone "Image" item. Same upload, but it *is* the row —
              // there is no input beside it. Not `required`, because that would
              // apply to every other field type too (admin conditions hide a
              // field, they do not relax its validation); the collection's
              // beforeValidate enforces it only for image rows.
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
      label: 'Google Sheet',
      type: 'text',
      admin: {
        description:
          'Optional. Paste the Sheet URL (or its id) to mirror this form’s responses there — one sheet per form. Share it with the service account address as an Editor first, or nothing will be written. Leave empty to use the default sheet, or to skip Sheets entirely.',
      },
      hooks: {
        // Officers will paste the whole URL from the address bar; keep the id.
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
      label: 'Google Drive Folder',
      type: 'text',
      admin: {
        description:
          'Where photos that respondents attach are stored — nothing is uploaded to this site. Paste the folder URL (or its id). It must live in the Drive of the account the site is authorised as, which is the account that ran the Drive setup. Leave empty to use the default folder.',
      },
      hooks: {
        // Officers will paste the whole URL from the address bar; keep the id.
        beforeValidate: [
          ({ value }) => {
            if (typeof value !== 'string') return value
            const match = value.match(/\/folders\/([a-zA-Z0-9-_]+)/)
            return match ? match[1] : value.trim()
          },
        ],
      },
    },
    {
      name: 'showCertificate',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Give respondents a certificate (usually for feedback forms)',
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
          'Immediate also lets them download it on the spot. Scheduled emails everyone who has submitted once the time passes, and keeps emailing late submitters after that.',
      },
    },
    {
      name: 'certificateSendAt',
      type: 'date',
      admin: {
        condition: (data) => data.showCertificate && data.certificateDelivery === 'scheduled',
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Default send time. Anyone not matched by a batch below goes out at this time.',
      },
    },
    {
      name: 'certificateBatches',
      type: 'array',
      admin: {
        condition: (data) => data.showCertificate && data.certificateDelivery === 'scheduled',
        description:
          'Optional — send different groups at different times, e.g. "Section A gets theirs at 5pm, Section B at 9pm". A batch is matched against one of this form\'s questions. Anyone who matches no batch falls back to the send time above.',
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
            description: 'How the name prints where {{name}} appears on the certificate itself',
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
            description: 'How the name reads in the email body, independent of the certificate',
          },
        },
      ],
    },
    {
      name: 'certificateEmailSubject',
      type: 'text',
      admin: {
        condition: (data) => data.showCertificate,
        placeholder: 'Your certificate — {{event}}',
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
        description:
          'Optional. {{name}} and {{event}} are replaced per recipient. Leave empty for the default message.',
      },
    },
    {
      name: 'certificateTemplateDriveId',
      label: 'Certificate Template (Google Slides)',
      type: 'text',
      admin: {
        condition: (data) => data.showCertificate,
        description:
          'Paste the Google Slides link (or its id) for this event’s certificate. The slide must contain {{name}} where the name should print. Leave empty to use the default template configured in the Apps Script.',
      },
      hooks: {
        // Officers will paste the whole URL from the address bar; keep the id.
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
      // Reads the Slides deck and reports which {{markers}} it contains, and
      // which of them nothing fills in yet. Purely advisory — it writes no
      // data, it just saves the officer from guessing.
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
      name: 'certificatePlaceholders',
      label: 'Certificate Fields',
      type: 'array',
      admin: {
        condition: (data) => data.showCertificate,
        description:
          'What each {{marker}} in the Slides template is filled with. {{name}} and {{event}} are automatic — the rest go here.',
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
                description: 'Without the braces — for {{USN}} write USN.',
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
      ],
    },
    {
      name: 'certificateTemplate',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data.showCertificate && data.certificateDelivery === 'immediate',
        description:
          'Only for the on-the-spot download. Emailed certificates come from the Google Slides template above.',
      },
    },
    {
      name: 'certificateConfig',
      type: 'group',
      admin: {
        condition: (data) => data.showCertificate,
      },
      fields: [
        { name: 'nameX', type: 'number', defaultValue: 400 },
        { name: 'nameY', type: 'number', defaultValue: 300 },
        { name: 'fontSize', type: 'number', defaultValue: 40 },
        { name: 'color', type: 'text', defaultValue: '#000000' },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }

        // An image row renders nothing but its picture, so a missing one is a
        // blank gap on the live form rather than a visible mistake in admin.
        const pictureless = imageRowsWithoutPicture(data?.steps)
        if (pictureless.length > 0) {
          throw new APIError(
            `Image questions need a picture. Missing on: ${pictureless.join(', ')}.`,
            400,
          )
        }

        // A certificate needs a name to print and an address to send to. Catch
        // that here rather than at send time, when the event is already over.
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
