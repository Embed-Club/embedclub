import { resolvePlaceholders, unmappedPlaceholders } from '@/lib/certificatePlaceholders'
import type { Form, FormSubmission } from '@/payload/payload-types'
import { describe, expect, it } from 'vitest'

/**
 * What ends up printed on somebody's certificate. Worth testing directly:
 * the failure mode is a batch of fifty certificates that all say "1st", or a
 * winner's that says nothing, and neither is visible until they have gone out.
 */

type Mapping = NonNullable<Form['certificatePlaceholders']>[number]

function form(mappings: Mapping[]): Form {
  return {
    title: 'IoT Workshop 2026',
    certificatePlaceholders: mappings,
  } as Form
}

function submission(
  answersByLabel: Record<string, unknown>,
  certificateValues: NonNullable<FormSubmission['certificateValues']> = [],
): FormSubmission {
  return { answersByLabel, certificateValues } as FormSubmission
}

describe('resolvePlaceholders', () => {
  it('always supplies name and event without a mapping', () => {
    const values = resolvePlaceholders(form([]), submission({}), 'Rafan Ahamad Sheik')
    expect(values).toEqual({
      name: 'Rafan Ahamad Sheik',
      event: 'IoT Workshop 2026',
    })
  })

  it('takes a value from the answer to a question', () => {
    const values = resolvePlaceholders(
      form([{ key: 'USN', source: 'question', questionLabel: 'USN' }]),
      submission({ USN: '4PA23CS102' }),
      'Someone',
    )
    expect(values.USN).toBe('4PA23CS102')
  })

  it('joins a multi-answer question into one string', () => {
    const values = resolvePlaceholders(
      form([{ key: 'Topics', source: 'question', questionLabel: 'Topics' }]),
      submission({ Topics: ['IoT', 'Cloud'] }),
      'Someone',
    )
    expect(values.Topics).toBe('IoT, Cloud')
  })

  it('prints a member-set value for the person it was set against', () => {
    const values = resolvePlaceholders(
      form([{ key: 'Place', source: 'perPerson' }]),
      submission({}, [{ key: 'Place', value: '1st' }]),
      'Someone',
    )
    expect(values.Place).toBe('1st')
  })

  it('matches the marker case-insensitively, as Slides does', () => {
    const values = resolvePlaceholders(
      form([{ key: 'Place', source: 'perPerson' }]),
      submission({}, [{ key: 'PLACE', value: '2nd' }]),
      'Someone',
    )
    expect(values.Place).toBe('2nd')
  })

  it('leaves a per-person marker unset for everyone who has no value', () => {
    // The common case at a competition: three people placed, forty did not.
    // Absent rather than empty, so the script blanks the marker in the deck.
    const values = resolvePlaceholders(
      form([{ key: 'Place', source: 'perPerson' }]),
      submission({}),
      'Someone',
    )
    expect(values.Place).toBeUndefined()
  })

  it('falls back to the form default when nobody set a value', () => {
    const values = resolvePlaceholders(
      form([{ key: 'Place', source: 'perPerson', defaultValue: 'Participant' }]),
      submission({}),
      'Someone',
    )
    expect(values.Place).toBe('Participant')
  })

  it('prefers the member-set value over the default', () => {
    const values = resolvePlaceholders(
      form([{ key: 'Place', source: 'perPerson', defaultValue: 'Participant' }]),
      submission({}, [{ key: 'Place', value: '1st' }]),
      'Someone',
    )
    expect(values.Place).toBe('1st')
  })

  it('does not let one person’s value leak into another’s certificate', () => {
    const mapping = form([{ key: 'Place', source: 'perPerson' }])
    const winner = resolvePlaceholders(
      mapping,
      submission({}, [{ key: 'Place', value: '1st' }]),
      'A',
    )
    const everyoneElse = resolvePlaceholders(mapping, submission({}), 'B')
    expect(winner.Place).toBe('1st')
    expect(everyoneElse.Place).toBeUndefined()
  })
})

describe('unmappedPlaceholders', () => {
  it('treats a per-person marker as covered', () => {
    const found = ['name', 'event', 'Place', 'USN']
    expect(unmappedPlaceholders(found, form([{ key: 'Place', source: 'perPerson' }]))).toEqual([
      'USN',
    ])
  })
})
