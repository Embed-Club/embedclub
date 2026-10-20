import {
  type Field,
  type Step,
  answerError,
  answerLabels,
  labelledAnswers,
  nextStep,
  visitedSteps,
} from '@/lib/formAnswers'
import { describe, expect, it } from 'vitest'

/**
 * The rules the form and the submit action share. A mistake here is either a
 * respondent blocked on a valid answer or a bad one stored, and branching
 * mistakes send people to the wrong page with no way to tell.
 */
const field = (f: Partial<Field>): Field =>
  ({ id: f.label, label: 'Q', fieldType: 'text', ...f }) as Field

const branchy: Step[] = [
  {
    stepTitle: 'One',
    fields: [
      field({
        id: 'sec',
        label: 'Section',
        fieldType: 'radio',
        branching: true,
        options: [
          { option: 'A', goToPage: 2 },
          { option: 'B', goToPage: 3 },
          { option: 'Done', goToPage: 0 },
        ],
      }),
    ],
  },
  { stepTitle: 'Two', afterStep: 0, fields: [field({ id: 'a', label: 'A only', required: true })] },
  { stepTitle: 'Three', fields: [field({ id: 'b', label: 'B only', required: true })] },
] as Step[]

describe('nextStep / visitedSteps', () => {
  it('follows the answer on a branching question', () => {
    expect(nextStep(branchy, 0, { sec: 'A' })).toBe(1)
    expect(nextStep(branchy, 0, { sec: 'B' })).toBe(2)
    expect(nextStep(branchy, 0, { sec: 'Done' })).toBe('submit')
  })

  it("honours a page's own after-page setting", () => {
    expect(nextStep(branchy, 1, {})).toBe('submit')
  })

  it('falls through to the next page with no branch answered', () => {
    expect(nextStep(branchy, 0, {})).toBe(1)
    expect(nextStep(branchy, 2, {})).toBe('submit')
  })

  it('only visits the pages on the chosen route', () => {
    expect(visitedSteps(branchy, { sec: 'B' })).toEqual([0, 2])
    expect(visitedSteps(branchy, { sec: 'A' })).toEqual([0, 1])
  })

  it('cannot loop forever on a page that points back at itself', () => {
    const loop = [{ stepTitle: 'x', afterStep: 1, fields: [] }] as unknown as Step[]
    expect(visitedSteps(loop, {})).toEqual([0])
  })
})

describe('answerError', () => {
  it('requires required questions', () => {
    expect(answerError(field({ required: true }), '')).toBeTruthy()
    expect(answerError(field({ required: false }), '')).toBeNull()
  })

  it('accepts one "Other" answer only when the question allows it', () => {
    const q = field({ fieldType: 'radio', options: [{ option: 'x' }] })
    expect(answerError(q, 'typed')).toBeTruthy()
    expect(answerError({ ...q, allowOther: true }, 'typed')).toBeNull()
    const c = field({ fieldType: 'checkbox', allowOther: true, options: [{ option: 'x' }] })
    expect(answerError(c, ['x', 'mine'])).toBeNull()
    expect(answerError(c, ['one', 'two'])).toBeTruthy()
  })

  it('needs every row of a required grid', () => {
    const g = field({
      fieldType: 'radioGrid',
      required: true,
      gridRows: [{ row: 'Pace' }, { row: 'Content' }],
      gridColumns: [{ column: 'Good' }, { column: 'Bad' }],
    })
    expect(answerError(g, { Pace: 'Good' })).toBeTruthy()
    expect(answerError(g, { Pace: 'Good', Content: 'Bad' })).toBeNull()
    expect(answerError(g, { Pace: 'Nope', Content: 'Bad' })).toBeTruthy()
  })

  it('keeps scale and rating answers inside their range', () => {
    const s = field({ fieldType: 'linearScale', scaleMin: 0, scaleMax: 3 })
    expect(answerError(s, '0')).toBeNull()
    expect(answerError(s, '4')).toBeTruthy()
    const r = field({ fieldType: 'rating', ratingMax: 5 })
    expect(answerError(r, '5')).toBeNull()
    expect(answerError(r, '0')).toBeTruthy()
  })

  it('applies response validation, with the member message', () => {
    const n = field({
      validationType: 'numberBetween',
      validationMin: 1,
      validationMax: 10,
      validationMessage: 'Pick 1-10',
    })
    expect(answerError(n, '11')).toBe('Pick 1-10')
    expect(answerError(n, '5')).toBeNull()
    const p = field({ validationType: 'pattern', validationPattern: '^[0-9]{10}$' })
    expect(answerError(p, '98765')).toBeTruthy()
    expect(answerError(p, '9876543210')).toBeNull()
  })

  it('never blames the respondent for a broken pattern', () => {
    expect(
      answerError(field({ validationType: 'pattern', validationPattern: '([' }), 'x'),
    ).toBeNull()
  })
})

describe('labels', () => {
  const grid = field({
    label: 'Rate',
    fieldType: 'checkboxGrid',
    gridRows: [{ row: 'A' }, { row: 'B' }],
    gridColumns: [{ column: 'x' }],
  })

  it('gives each grid row its own column, the way Google does', () => {
    expect(labelledAnswers(grid, { A: ['x'] })).toEqual([
      ['Rate [A]', ['x']],
      ['Rate [B]', ''],
    ])
    expect(answerLabels([{ stepTitle: 's', fields: [grid] }] as Step[])).toEqual([
      'Rate [A]',
      'Rate [B]',
    ])
  })

  it('leaves display-only items out of the sheet', () => {
    const steps = [
      {
        stepTitle: 's',
        fields: [field({ label: 'Title', fieldType: 'sectionText' }), field({ label: 'Name' })],
      },
    ] as Step[]
    expect(answerLabels(steps)).toEqual(['Name'])
  })
})
