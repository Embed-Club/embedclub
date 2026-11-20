import type { Field, Step } from '@/lib/formAnswers'
import { buildGoogleFormPayload, googleFormEndpoint } from '@/lib/googleForms'
import { describe, expect, it } from 'vitest'

const q = (f: Partial<Field>): Field =>
  ({ id: f.label || 'q', label: f.label || 'Question', fieldType: 'text', ...f }) as Field

describe('googleFormEndpoint', () => {
  it('resolves modern Google Form links to formResponse', () => {
    const url = 'https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_12345/viewform'
    expect(googleFormEndpoint(url)).toBe(
      'https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_12345/formResponse',
    )
  })

  it('resolves legacy Google Form links to formResponse', () => {
    const url = 'https://docs.google.com/forms/d/1_EXAMPLE_67890/viewform?usp=sf_link'
    expect(googleFormEndpoint(url)).toBe(
      'https://docs.google.com/forms/d/1_EXAMPLE_67890/formResponse',
    )
  })

  it('resolves Google Form links containing /u/0/ or account paths', () => {
    const url = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc_EXAMPLE_12345/viewform?usp=sharing'
    expect(googleFormEndpoint(url)).toBe(
      'https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_12345/formResponse',
    )
  })

  it('returns null for non-Google Form links', () => {
    expect(googleFormEndpoint('https://example.com/not-a-form')).toBeNull()
  })
})

describe('buildGoogleFormPayload', () => {
  it('maps standard fields to entry parameters', () => {
    const steps: Step[] = [
      {
        stepTitle: 'Details',
        fields: [
          q({ id: 'name', label: 'Name', googleEntryId: '100001' }),
          q({ id: 'email', label: 'Email', fieldType: 'email', googleEntryId: '100002' }),
        ],
      },
    ]

    const answers = {
      name: 'Alice',
      email: 'alice@example.com',
    }

    const res = buildGoogleFormPayload(steps, answers)
    expect(res.error).toBeNull()
    expect(res.params.get('entry.100001')).toBe('Alice')
    expect(res.params.get('entry.100002')).toBe('alice@example.com')
  })

  it('handles multi-value fields like checkboxes', () => {
    const steps: Step[] = [
      {
        stepTitle: 'Preferences',
        fields: [
          q({
            id: 'interests',
            label: 'Interests',
            fieldType: 'checkbox',
            googleEntryId: '200001',
          }),
        ],
      },
    ]

    const answers = {
      interests: ['Hardware', 'Robotics'],
    }

    const res = buildGoogleFormPayload(steps, answers)
    expect(res.error).toBeNull()
    expect(res.params.getAll('entry.200001')).toEqual(['Hardware', 'Robotics'])
  })

  it('formats grid fields as row: pick', () => {
    const steps: Step[] = [
      {
        stepTitle: 'Rating',
        fields: [
          q({
            id: 'feedback',
            label: 'Feedback',
            fieldType: 'radioGrid',
            googleEntryId: '300001',
          }),
        ],
      },
    ]

    const answers = {
      feedback: {
        Venue: 'Great',
        Content: 'Good',
      },
    }

    const res = buildGoogleFormPayload(steps, answers)
    expect(res.error).toBeNull()
    expect(res.params.getAll('entry.300001')).toEqual(['Venue: Great', 'Content: Good'])
  })

  it('flags unmapped questions when answered', () => {
    const steps: Step[] = [
      {
        stepTitle: 'Info',
        fields: [q({ id: 'dept', label: 'Department' })],
      },
    ]

    const answers = { dept: 'ECE' }
    const res = buildGoogleFormPayload(steps, answers)
    expect(res.error).toContain('Department')
  })

  it('skips display-only and image upload questions', () => {
    const steps: Step[] = [
      {
        stepTitle: 'Step',
        fields: [
          q({ id: 'text-block', label: 'Notice', fieldType: 'sectionText' }),
          q({ id: 'file', label: 'Resume', fieldType: 'imageUpload', googleEntryId: '400001' }),
        ],
      },
    ]

    const answers = { file: 'file-123' }
    const res = buildGoogleFormPayload(steps, answers)
    expect(res.error).toBeNull()
    expect(res.skippedUploads).toContain('Resume')
    expect(res.params.get('entry.400001')).toBeNull()
  })
})
