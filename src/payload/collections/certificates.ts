import { syncCertificateStatuses } from '@/lib/certificateLinks'
import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'

/**
 * A certificate, linked to the form whose respondents receive it.
 *
 * These used to be a block of fields on every form, which meant a member
 * designing a registration form scrolled past twenty certificate settings it
 * would never use, and the question a placeholder came from had to be typed
 * out by hand. Now a certificate is its own document: pick the form first, and
 * every question list below loads from that form.
 *
 * Linking a certificate to a form that already has responses queues those
 * respondents too (see `syncCertificateStatuses`), so a feedback form can be
 * given a certificate after the event without anyone re-submitting.
 */

const NAME_CASE_OPTIONS = [
  { label: 'As typed', value: 'asTyped' },
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'Title Case', value: 'title' },
]

const hasForm = (data: Record<string, unknown> | undefined) => Boolean(data?.form)

/**
 * A text field that picks one of the linked form's questions, by label. Stored
 * as the label because that is how answers are keyed in `answersByLabel`.
 */
const questionField = (opts: {
  name: string
  description: string
  required?: boolean
  width?: string
  condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean
}): Field => ({
  name: opts.name,
  label: 'Question',
  type: 'text',
  required: opts.required,
  admin: {
    description: opts.description,
    width: opts.width,
    condition: opts.condition,
    components: {
      Field: {
        path: '@/components/admin/formQuestionSelect',
        clientProps: { mode: 'question' },
      },
    },
  },
})

export const Certificates: CollectionConfig = {
  slug: 'certificates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'form', 'delivery', 'enabled', 'updatedAt'],
    description:
      'Certificates emailed to the people who answer a form. Pick the form first - the question lists load from it.',
    group: 'Forms',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      unique: true,
      index: true,
      // A section is covered through its parent, so only standalone forms and
      // sectioned parents are offered.
      filterOptions: () => ({ sectionOf: { exists: false } }),
      admin: {
        description:
          'Start here. For a form answered in sections, pick the parent - every section is covered.',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Only for the admin list. Filled in from the form if left empty.',
        condition: hasForm,
      },
    },
    {
      name: 'enabled',
      label: 'Sending on',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Switch off to pause sending without losing the setup.',
      },
    },
    {
      name: 'eventName',
      type: 'text',
      admin: {
        condition: hasForm,
        description:
          'What {{event}} prints as, on the certificate and in the email. Defaults to the form title.',
      },
    },
    {
      name: 'templateDriveId',
      label: 'Certificate Template (Google Slides)',
      type: 'text',
      admin: {
        condition: hasForm,
        description: 'Google Slides link for the certificate. The slide must contain {{name}}.',
      },
      hooks: {
        // Members paste the whole URL from the address bar; keep the id.
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
      name: 'placeholderScan',
      type: 'ui',
      admin: {
        condition: hasForm,
        components: { Field: '@/components/admin/certificatePlaceholderScanner' },
      },
    },
    {
      name: 'placeholders',
      label: 'Certificate Fields',
      type: 'array',
      admin: {
        condition: hasForm,
        description:
          'Fills the other {{markers}} in the template. {{name}} and {{event}} are automatic.',
        components: { RowLabel: '@/components/admin/certificatePlaceholderRowLabel' },
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
                { label: 'An answer from the form', value: 'question' },
                { label: 'The same value for everyone', value: 'fixed' },
                // Placings are the case this exists for: the winner cannot be
                // asked to declare themselves on a feedback form.
                { label: 'Set per person, by a member', value: 'perPerson' },
              ],
              admin: { width: '60%' },
            },
          ],
        },
        questionField({
          name: 'questionLabel',
          description: 'The answer to this question is printed.',
          condition: (_data, siblingData) => siblingData?.source === 'question',
        }),
        {
          name: 'fixedValue',
          label: 'Value',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.source === 'fixed',
            description: 'Printed identically on every certificate',
          },
        },
        {
          name: 'defaultValue',
          label: 'Default',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.source === 'perPerson',
            description: 'Used when no per-person value is set. Leave empty to print nothing.',
          },
        },
      ],
    },
    {
      name: 'test',
      label: 'Test Certificate',
      type: 'ui',
      admin: {
        condition: hasForm,
        components: { Field: '@/components/admin/certificateTestPanel' },
      },
    },
    {
      name: 'delivery',
      type: 'select',
      defaultValue: 'immediate',
      options: [
        { label: 'Straight after they submit', value: 'immediate' },
        { label: 'Email everyone at a set time', value: 'scheduled' },
      ],
      admin: {
        condition: hasForm,
        description:
          'Immediate also sends to everyone who has already answered, on the next run after saving.',
      },
    },
    {
      name: 'sendAt',
      type: 'date',
      admin: {
        condition: (data) => hasForm(data) && data?.delivery === 'scheduled',
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Default send time. Anyone not matched by a batch below goes out at this time.',
      },
    },
    {
      name: 'batches',
      type: 'array',
      admin: {
        condition: (data) => hasForm(data) && data?.delivery === 'scheduled',
        description: 'Optional. Send different groups at different times, matched on one answer.',
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
            questionField({
              name: 'matchField',
              description: 'The question that identifies the group',
              required: true,
              width: '34%',
            }),
            {
              name: 'matchValue',
              label: 'Answer',
              type: 'text',
              required: true,
              admin: {
                width: '33%',
                description: 'The answer that puts someone in this batch',
                components: {
                  Field: {
                    path: '@/components/admin/formQuestionSelect',
                    clientProps: { mode: 'answer', questionField: 'matchField' },
                  },
                },
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
      admin: { condition: hasForm },
      fields: [
        {
          name: 'nameCase',
          label: 'Name on Certificate',
          type: 'select',
          defaultValue: 'asTyped',
          options: NAME_CASE_OPTIONS,
          admin: {
            width: '50%',
            description: 'How the name prints where {{name}} appears on the certificate',
          },
        },
        {
          name: 'emailNameCase',
          label: 'Name in Email Greeting',
          type: 'select',
          defaultValue: 'asTyped',
          options: NAME_CASE_OPTIONS,
          admin: {
            width: '50%',
            description: 'How the name reads in the email body',
          },
        },
      ],
    },
    {
      name: 'emailSubject',
      type: 'text',
      admin: {
        condition: hasForm,
        placeholder: 'Your certificate - {{event}}',
        description: 'Optional. {{event}} is filled in. Leave empty for the default subject.',
      },
    },
    {
      name: 'emailBody',
      type: 'textarea',
      admin: {
        condition: hasForm,
        placeholder:
          'Dear {{name}},\n\nThank you for attending {{event}}. Your certificate is attached.\n\nRegards,\nEmbed Club',
        description: 'Optional. {{name}} and {{event}} are filled in per person.',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data?.form) return data
        const formId = typeof data.form === 'object' ? data.form.id : data.form
        const form = await req.payload.findByID({
          collection: 'forms',
          id: formId,
          depth: 0,
          req,
        })
        if (!data.title?.trim()) data.title = `${form.title} - Certificate`

        // A certificate needs a name to print and an address to send to. Caught
        // here rather than at send time, when the event is already over.
        if (data.enabled !== false) {
          const roles = (form.steps ?? []).flatMap((step) =>
            (step.fields ?? []).map((field) => field.role),
          )
          const names = roles.filter((role) => role === 'name').length
          const emails = roles.filter((role) => role === 'email').length
          const problems: string[] = []
          if (names !== 1) problems.push(`one question marked as the name (found ${names})`)
          if (emails !== 1) problems.push(`one question marked as the email (found ${emails})`)
          if (problems.length > 0) {
            throw new APIError(
              `"${form.title}" needs ${problems.join(' and ')} - set it in the question's Role on the form.`,
              400,
            )
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await syncCertificateStatuses(req.payload, doc, previousDoc, req)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await syncCertificateStatuses(req.payload, { ...doc, enabled: false }, doc, req)
      },
    ],
  },
}
