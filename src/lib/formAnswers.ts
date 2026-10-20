import type { Form } from '@/payload/payload-types'

/**
 * What an answer looks like, how it is checked, and where the form goes next.
 *
 * Shared by the form in the browser and the submit action on the server, so
 * the two can never disagree about whether an answer is acceptable - the
 * server still re-checks everything, it just uses the same rules.
 */

export type Step = NonNullable<Form['steps']>[number]
export type Field = NonNullable<Step['fields']>[number]

/** A grid answer is one choice (or several) per row, keyed by the row text. */
export type GridAnswer = Record<string, string | string[]>
export type FormAnswer = string | string[] | GridAnswer
/** Answers are keyed by each form field's Payload row id. */
export type FormAnswers = Record<string, FormAnswer>

/** Items that show something but take no answer. */
export const DISPLAY_ONLY_TYPES = ['image', 'sectionText', 'video']

export const isDisplayOnly = (field: Pick<Field, 'fieldType'>) =>
  DISPLAY_ONLY_TYPES.includes(field.fieldType)

export const isGrid = (field: Pick<Field, 'fieldType'>) =>
  field.fieldType === 'radioGrid' || field.fieldType === 'checkboxGrid'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function isEmptyAnswer(value: FormAnswer | undefined): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return Object.values(value).every((v) => (Array.isArray(v) ? v.length === 0 : !v))
}

const rows = (field: Field) => (field.gridRows ?? []).map((r) => r.row)
const columns = (field: Field) => (field.gridColumns ?? []).map((c) => c.column)
const options = (field: Field) => (field.options ?? []).map((o) => o.option)

/** The numbers a linear-scale or rating question offers. */
export function scaleValues(field: Field): number[] {
  if (field.fieldType === 'rating') {
    const max = Math.min(10, Math.max(3, field.ratingMax ?? 5))
    return Array.from({ length: max }, (_, i) => i + 1)
  }
  const min = field.scaleMin === 0 ? 0 : 1
  const max = Math.min(10, Math.max(2, field.scaleMax ?? 5))
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

/**
 * Why an answer is not acceptable, or null if it is. `required` is included,
 * so this is the single check for a question.
 */
export function answerError(field: Field, value: FormAnswer | undefined): string | null {
  if (isDisplayOnly(field)) return null

  if (isEmptyAnswer(value)) {
    return field.required ? 'This is a required question' : null
  }

  const text = typeof value === 'string' ? value.trim() : ''

  switch (field.fieldType) {
    case 'email':
      if (!EMAIL_RE.test(text)) return 'Enter a valid email address'
      break
    case 'number':
      if (Number.isNaN(Number(text))) return 'Enter a number'
      break
    case 'time':
      if (!TIME_RE.test(text)) return 'Enter a time'
      break
    case 'date':
      if (Number.isNaN(Date.parse(text))) return 'Enter a date'
      break
    case 'linearScale':
    case 'rating':
      if (!scaleValues(field).includes(Number(text))) return 'Pick one of the values shown'
      break
    case 'select':
    case 'radio':
    case 'checkbox': {
      const picked = Array.isArray(value) ? value : [text]
      if (typeof value === 'object' && !Array.isArray(value)) return 'Invalid answer'
      const allowed = options(field)
      const unknown = picked.filter((v) => !allowed.includes(v))
      // "Other" is whatever the person typed, so it is the one value allowed
      // to be off the list - and only one of it.
      if (unknown.length > (field.allowOther ? 1 : 0)) return 'Pick from the options shown'
      if (unknown.some((v) => !v.trim())) return 'Fill in "Other"'
      break
    }
    case 'radioGrid':
    case 'checkboxGrid': {
      if (typeof value !== 'object' || Array.isArray(value)) return 'Invalid answer'
      const allowedRows = rows(field)
      const allowedColumns = columns(field)
      for (const [row, choice] of Object.entries(value)) {
        const picked = Array.isArray(choice) ? choice : [choice]
        if (!allowedRows.includes(row)) return 'Invalid answer'
        if (picked.some((c) => !allowedColumns.includes(c))) return 'Invalid answer'
      }
      // Google's "Require a response in each row" is what required means here.
      if (field.required && allowedRows.some((row) => isEmptyAnswer(value[row] ?? ''))) {
        return 'This question requires one response per row'
      }
      break
    }
  }

  const message = field.validationMessage?.trim()
  switch (field.validationType) {
    case 'numberBetween': {
      const n = Number(text)
      const low = field.validationMin ?? Number.NEGATIVE_INFINITY
      const high = field.validationMax ?? Number.POSITIVE_INFINITY
      if (Number.isNaN(n) || n < low || n > high) {
        return message || `Enter a number between ${field.validationMin} and ${field.validationMax}`
      }
      break
    }
    case 'minLength':
      if (text.length < (field.validationMin ?? 0)) {
        return message || `Use at least ${field.validationMin} characters`
      }
      break
    case 'maxLength':
      if (text.length > (field.validationMax ?? Number.POSITIVE_INFINITY)) {
        return message || `Use at most ${field.validationMax} characters`
      }
      break
    case 'pattern':
      if (field.validationPattern) {
        let re: RegExp | null = null
        try {
          re = new RegExp(field.validationPattern)
        } catch {
          // A broken pattern is the member's mistake, not the respondent's.
          re = null
        }
        if (re && !re.test(text)) return message || 'That answer is not in the expected format'
      }
      break
  }

  return null
}

/**
 * The labelled columns an answer occupies - one for most questions, one per
 * row for a grid, named `Question [Row]` the way Google's own sheets do.
 * This is what `answersByLabel`, the Sheets mirror and certificate batches
 * read, so a grid row can be matched on like any other answer.
 */
export function labelledAnswers(field: Field, value: FormAnswer): [string, string | string[]][] {
  if (isGrid(field)) {
    const grid = (typeof value === 'object' && !Array.isArray(value) ? value : {}) as GridAnswer
    return rows(field).map((row) => [`${field.label} [${row}]`, grid[row] ?? ''])
  }
  return [[field.label, value as string | string[]]]
}

/** Every column label a form produces, in order - the Sheets header row. */
export function answerLabels(steps: Step[] | null | undefined): string[] {
  const out: string[] = []
  for (const step of steps ?? []) {
    for (const field of step.fields ?? []) {
      if (isDisplayOnly(field) || !field.label) continue
      const labels = isGrid(field)
        ? rows(field).map((row) => `${field.label} [${row}]`)
        : [field.label]
      for (const label of labels) if (!out.includes(label)) out.push(label)
    }
  }
  return out
}

/**
 * Which page comes after `current`, or `'submit'`.
 *
 * Google Forms' rules: an answered branching question on the page decides
 * (the last one wins), otherwise the page's own "after this page" setting,
 * otherwise the next page. Page numbers are 1-based as members type them;
 * 0 means submit.
 */
export function nextStep(steps: Step[], current: number, answers: FormAnswers): number | 'submit' {
  const target = (page: number | null | undefined): number | 'submit' | null => {
    if (page === null || page === undefined) return null
    if (page === 0) return 'submit'
    const index = page - 1
    return index >= 0 && index < steps.length ? index : null
  }

  let jump: number | 'submit' | null = null
  for (const field of steps[current]?.fields ?? []) {
    if (!field.branching) continue
    const picked = answers[field.id ?? '']
    if (typeof picked !== 'string' || !picked) continue
    const option = field.options?.find((o) => o.option === picked)
    const to = target(option?.goToPage)
    if (to !== null) jump = to
  }
  if (jump !== null) return jump

  const after = target(steps[current]?.afterStep)
  if (after !== null) return after

  return current + 1 < steps.length ? current + 1 : 'submit'
}

/**
 * The pages a respondent actually passes through for these answers. Only
 * questions on these pages are validated or stored - an answer left on a page
 * that a later choice skipped is not part of the response, as in Google Forms.
 */
export function visitedSteps(steps: Step[], answers: FormAnswers): number[] {
  const seen: number[] = []
  let at: number | 'submit' = 0
  while (at !== 'submit' && !seen.includes(at) && steps[at]) {
    seen.push(at)
    at = nextStep(steps, at, answers)
  }
  return seen
}
