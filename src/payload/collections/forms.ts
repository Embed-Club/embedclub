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
const ROLELESS_TYPES = ['image', 'imageUpload', 'sectionText', 'video']

/** Items that show something but take no answer - never required, never a column. */
const DISPLAY_ONLY_TYPES = ['image', 'sectionText', 'video']

/**
 * The question an option row belongs to, from the option's schema path
 * (`steps.0.fields.2.options.1.goToPage`). Option conditions only get their own
 * row as sibling data, and "is branching on" lives one level up.
 */
function parentField(data: unknown, path: (string | number)[] | undefined) {
  const at = path?.lastIndexOf('options') ?? -1
  if (at < 0) return undefined
  let node: unknown = data
  for (const key of path?.slice(0, at) ?? []) {
    node = (node as Record<string | number, unknown> | undefined)?.[key]
  }
  return node as { branching?: boolean } | undefined
}

/**
 * Question types that need more than a label to render - grids need rows and
 * columns, choice questions need options, a video needs its link. Caught on
 * save so the live form never shows a question with nothing to click.
 */
function incompleteQuestions(steps: StepRow[] | null | undefined): string[] {
  const out: string[] = []
  for (const step of steps ?? []) {
    for (const field of (step.fields ?? []) as (FieldRow & Record<string, unknown>)[]) {
      const name = field.label || 'Untitled'
      const count = (key: string) => ((field[key] as unknown[] | null | undefined) ?? []).length
      switch (field.fieldType) {
        case 'select':
        case 'radio':
        case 'checkbox':
          if (count('options') === 0) out.push(`${name} has no options`)
          break
        case 'radioGrid':
        case 'checkboxGrid':
          if (count('gridRows') === 0 || count('gridColumns') === 0) {
            out.push(`${name} needs rows and columns`)
          }
          break
        case 'video':
          if (!field.videoUrl) out.push(`${name} has no YouTube link`)
          break
      }
    }
  }
  return out
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
 *
 * Until 2026-07-28 each field carried a hand-copied `entry.<id>` from a Google
 * Form and submissions were forwarded there. That was dropped: it was the most
 * error-prone thing a member had to do, and Google returns 200 even when the
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
    delete: ({ req: { user } }) => Boolean(user),
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
        // made a new form unsaveable: the member cannot type into a read-only
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
          name: 'afterStep',
          label: 'After this page, go to page',
          type: 'number',
          min: 0,
          admin: {
            description:
              'Optional. Blank = the next page. 0 = submit. A question with "Go to page based on answer" overrides this.',
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
                    { label: 'Linear Scale (e.g. 1 to 5)', value: 'linearScale' },
                    { label: 'Rating (stars)', value: 'rating' },
                    { label: 'Multiple Choice Grid', value: 'radioGrid' },
                    { label: 'Checkbox Grid', value: 'checkboxGrid' },
                    { label: 'Date', value: 'date' },
                    { label: 'Time', value: 'time' },
                    {
                      label: 'File Upload (respondent attaches a photo or PDF)',
                      value: 'imageUpload',
                    },
                    { label: 'Title and Description (no answer)', value: 'sectionText' },
                    {
                      label: 'Image (no answer - just shows a picture)',
                      value: 'image',
                    },
                    { label: 'Video (no answer - a YouTube video)', value: 'video' },
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
                    condition: (_data, siblingData) =>
                      !DISPLAY_ONLY_TYPES.includes(siblingData?.fieldType),
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
                  ['text', 'email', 'phone', 'number', 'textarea', 'select'].includes(
                    siblingData?.fieldType,
                  ),
              },
            },
            {
              // Text, not rich text: a sentence or two under a question. Links
              // typed into it are made clickable on the page.
              name: 'helpText',
              label: 'Description',
              type: 'textarea',
              admin: {
                rows: 2,
                description:
                  'Optional. Shown under the question - or under the title, for a Title and Description item. Links become clickable.',
              },
            },
            {
              name: 'videoUrl',
              label: 'YouTube URL',
              type: 'text',
              admin: {
                condition: (_data, siblingData) => siblingData?.fieldType === 'video',
                placeholder: 'https://www.youtube.com/watch?v=...',
              },
            },
            {
              type: 'row',
              admin: {
                condition: (_data, siblingData) => siblingData?.fieldType === 'linearScale',
              },
              fields: [
                {
                  name: 'scaleMin',
                  label: 'From',
                  type: 'number',
                  defaultValue: 1,
                  min: 0,
                  max: 1,
                  admin: { width: '20%' },
                },
                {
                  name: 'scaleMax',
                  label: 'To',
                  type: 'number',
                  defaultValue: 5,
                  min: 2,
                  max: 10,
                  admin: { width: '20%' },
                },
                {
                  name: 'scaleMinLabel',
                  label: 'Label at the low end',
                  type: 'text',
                  admin: { width: '30%', placeholder: 'e.g. Poor' },
                },
                {
                  name: 'scaleMaxLabel',
                  label: 'Label at the high end',
                  type: 'text',
                  admin: { width: '30%', placeholder: 'e.g. Excellent' },
                },
              ],
            },
            {
              name: 'ratingMax',
              label: 'Number of stars',
              type: 'number',
              defaultValue: 5,
              min: 3,
              max: 10,
              admin: {
                condition: (_data, siblingData) => siblingData?.fieldType === 'rating',
              },
            },
            {
              name: 'gridRows',
              label: 'Rows',
              type: 'array',
              admin: {
                condition: (_data, siblingData) =>
                  ['radioGrid', 'checkboxGrid'].includes(siblingData?.fieldType),
                description: 'One per thing being rated - e.g. Content, Pace, Speaker.',
              },
              fields: [{ name: 'row', type: 'text', required: true }],
            },
            {
              name: 'gridColumns',
              label: 'Columns',
              type: 'array',
              admin: {
                condition: (_data, siblingData) =>
                  ['radioGrid', 'checkboxGrid'].includes(siblingData?.fieldType),
                description: 'The choices offered on every row - e.g. Poor, Okay, Good.',
              },
              fields: [{ name: 'column', type: 'text', required: true }],
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
                  type: 'row',
                  fields: [
                    {
                      name: 'option',
                      type: 'text',
                      required: true,
                      admin: { width: '70%' },
                    },
                    {
                      // Google Forms' "Go to section based on answer". Only read
                      // when the question has branching switched on.
                      name: 'goToPage',
                      label: 'Then go to page',
                      type: 'number',
                      min: 0,
                      admin: {
                        width: '30%',
                        condition: (data, _siblingData, { path }) =>
                          Boolean(parentField(data, path)?.branching),
                        description: 'Blank = next page. 0 = submit.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              admin: {
                condition: (_data, siblingData) =>
                  ['select', 'radio', 'checkbox'].includes(siblingData?.fieldType),
              },
              fields: [
                {
                  name: 'allowOther',
                  label: 'Add "Other" with a text box',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    condition: (_data, siblingData) =>
                      ['radio', 'checkbox'].includes(siblingData?.fieldType),
                  },
                },
                {
                  name: 'shuffleOptions',
                  label: 'Shuffle option order',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'branching',
                  label: 'Go to page based on answer',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    condition: (_data, siblingData) =>
                      ['select', 'radio'].includes(siblingData?.fieldType),
                  },
                },
              ],
            },
            {
              name: 'validationType',
              label: 'Response validation',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Number between', value: 'numberBetween' },
                { label: 'At least this many characters', value: 'minLength' },
                { label: 'At most this many characters', value: 'maxLength' },
                { label: 'Matches a pattern (regular expression)', value: 'pattern' },
              ],
              admin: {
                condition: (_data, siblingData) =>
                  ['text', 'textarea', 'number', 'phone'].includes(siblingData?.fieldType),
              },
            },
            {
              type: 'row',
              admin: {
                condition: (_data, siblingData) =>
                  Boolean(siblingData?.validationType) && siblingData?.validationType !== 'none',
              },
              fields: [
                {
                  name: 'validationMin',
                  label: 'Minimum',
                  type: 'number',
                  admin: {
                    width: '25%',
                    condition: (_data, siblingData) =>
                      ['numberBetween', 'minLength'].includes(siblingData?.validationType),
                  },
                },
                {
                  name: 'validationMax',
                  label: 'Maximum',
                  type: 'number',
                  admin: {
                    width: '25%',
                    condition: (_data, siblingData) =>
                      ['numberBetween', 'maxLength'].includes(siblingData?.validationType),
                  },
                },
                {
                  name: 'validationPattern',
                  label: 'Pattern',
                  type: 'text',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. ^[0-9]{10}$',
                    condition: (_data, siblingData) => siblingData?.validationType === 'pattern',
                  },
                },
                {
                  name: 'validationMessage',
                  label: 'Error message',
                  type: 'text',
                  admin: { width: '50%', placeholder: 'Shown when the answer does not fit' },
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
      type: 'row',
      fields: [
        {
          name: 'showProgressBar',
          label: 'Show progress bar',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allowAnotherResponse',
          label: 'Show "Submit another response" link',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
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
        // members will paste the whole URL from the address bar; keep the id.
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
        // members will paste the whole URL from the address bar; keep the id.
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
      // Certificates live in their own collection and point at a form. This
      // shows the one linked here, with a link to create one if there is none.
      name: 'certificate',
      type: 'join',
      collection: 'certificates',
      on: 'form',
      admin: {
        condition: (data) => !data?.sectionOf,
        description: 'Set up under Forms > Certificates. Pick this form there.',
      },
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

        const incomplete = incompleteQuestions(data?.steps)
        if (incomplete.length > 0) {
          throw new APIError(
            `Some questions are missing their setup: ${incomplete.join('; ')}.`,
            400,
          )
        }

        return data
      },
    ],
  },
}
