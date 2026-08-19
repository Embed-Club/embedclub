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
type StepRow = { fields?: FieldRow[] | null; stepTitle?: string | null; stepImage?: unknown }

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
 * Native form builder. Officers author the form here and it is rendered as a
 * multi-step wizard on the site; answers are stored in `form-submissions`,
 * which is the club's record - there is no Google Form behind it.
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
        // Deliberately not readOnly. It was, and combined with `required` that
        // made a new form unsaveable: the officer cannot type into a read-only
        // box, and the admin's own validation rejects the empty value before
        // the request is ever sent - so the hook that fills it never runs.
        // Editable matches the events collection, and also gives a way out when
        // two forms would generate the same slug.
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
      // Some events ask the same questions of two groups: an A and a B section,
      // day one and day two of a workshop. One set of questions, answered
      // separately, and the club wants both the split and the whole.
      //
      // So the questions live here once, on the form itself, and each section
      // reuses them. Sections exist to keep their responses apart, not to hold
      // a second copy of the same form - a copy would drift the moment somebody
      // edited one of them, and answers to "the same" question would end up
      // under different field ids, which is what makes combining them later
      // impossible.
      //
      // A checkbox rather than something inferred from whether sections exist,
      // because this is authored before they do.
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
      // Only containers, so sections cannot nest inside sections.
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
      // Provenance for the forms imported from Google in 2026-08, and what
      // makes re-running that import safe: a form already carrying an id is
      // skipped rather than created twice.
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
      // Not `required` at the field level, because a section legitimately has
      // none - it asks the questions its parent form defines. The
      // beforeValidate hook enforces it for every other form, which is the same
      // guarantee with the one exception carved out.
      admin: {
        condition: (data) => !data?.sectionOf,
        description:
          'Each step is one screen the person fills in before moving to the next. Group related questions together - personal details on one step, event choices on another - and add a step for each group. One long step works too; several short ones are just easier to fill in on a phone.',
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
            description: 'Optional image shown at the top of this step, under its description.',
          },
        },
        {
          // Not required: a step may carry nothing but its image - a poster, a
          // payment QR, a WhatsApp group code - and asking for a question to go
          // with it would mean inventing one. The collection's beforeValidate
          // still rejects a step that has neither questions nor an image, which
          // would render as a blank screen.
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
                    { label: 'Image Upload (respondent attaches a photo)', value: 'imageUpload' },
                    { label: 'Image (no answer - just shows a picture)', value: 'image' },
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
                { label: 'Email - where certificates are sent', value: 'email' },
                { label: `USN - sorted in the responses sheet (${USN_FORMAT_HINT})`, value: 'usn' },
              ],
              admin: {
                condition: (_data, siblingData) => !ROLELESS_TYPES.includes(siblingData?.fieldType),
                description:
                  'Tells the club what this answer is, so it can be used automatically. Name and email are what certificates are printed with and sent to, so a form that issues them needs one of each. A USN is upper-cased and format-checked on submission, which keeps the responses sheet sortable by batch and department. Leave as "Just an answer" for ordinary questions.',
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
              // Decoration attached to a question - the diagram the question is
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
              // The standalone "Image" item. Same upload, but it *is* the row -
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
          'Optional. Paste a Sheet URL to mirror responses there. Share it with the service account as an Editor first.',
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
        description: 'Google Drive folder for attachments. Leave empty to use the default.',
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
        description: 'Immediate sends on submit. Scheduled sends at the time you set below.',
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
        description: 'Optional. Send different groups at different times, matched on one question.',
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
      name: 'certificateTemplateDriveId',
      label: 'Certificate Template (Google Slides)',
      type: 'text',
      admin: {
        condition: (data) => data.showCertificate,
        description: 'Google Slides link for the certificate. The slide must contain {{name}}.',
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
      // which of them nothing fills in yet. Purely advisory - it writes no
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
                // Placings are the case this exists for: the winner cannot be
                // asked to declare themselves on a feedback form, and one fixed
                // value would print "1st" on all fifty certificates.
                { label: 'Set per person, by an officer', value: 'perPerson' },
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
            description: 'Used when no per-person value is set. Leave empty to print nothing.',
          },
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

        // A section asks its parent's questions, so it is the one form allowed
        // to have no steps of its own. Everything else needs at least one,
        // which the field itself can no longer require now that the exception
        // exists.
        if (!data?.sectionOf && (data?.steps?.length ?? 0) === 0) {
          throw new APIError('A form needs at least one step.', 400)
        }

        if (data?.sectionOf) {
          if (!data?.sectionLabel?.trim()) {
            throw new APIError('A section needs a label - e.g. A Section, or Day 1.', 400)
          }
          // Questions on a section are dropped rather than rejected: the parent
          // is the single definition of them, and a second copy here would
          // drift from it and split the answers across two sets of field ids.
          data.steps = []
          // The label is what the URL segment comes from, so it is regenerated
          // on every save rather than only when empty: a renamed section whose
          // URL still said the old name would be worse than a changed link.
          data.sectionSlug = generateSlug(data.sectionLabel)
        }

        // A step with no questions is fine when it exists to show something -
        // a poster, a QR code - but one with neither is a blank screen the
        // person has to click past.
        const empty = emptySteps(data?.steps)
        if (empty.length > 0) {
          throw new APIError(
            `A step needs at least one question, or an image to show. Nothing on: ${empty.join(', ')}.`,
            400,
          )
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
