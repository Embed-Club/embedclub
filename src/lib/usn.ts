/**
 * University Seat Numbers.
 *
 * A USN is made of five parts, e.g. `4PA23CS102`:
 *
 *   4   region code (Mangalore)
 *   PA  college code
 *   23  batch year of admission
 *   CS  course / department
 *   102 the student's number in that batch
 *
 * The department letters are optional in the pattern: older and other-college
 * numbers run them together with the student number (`9CN19034`), and rejecting
 * a real student's USN is worse than accepting a slightly odd one. This is a
 * shape check to catch typos, not an enrolment lookup.
 */
const USN_PATTERN = /^\d{1,2}[A-Z]{2}\d{2}[A-Z]{0,2}\d{2,4}$/

/** Shown under the field and in the error, so the rule is never a guess. */
export const USN_FORMAT_HINT = 'e.g. 4PA23CS102'

/**
 * Upper-cases and strips spaces.
 *
 * Students type these however their keyboard was set, and a sheet sorted on a
 * mix of `4pa23cs102` and `4PA23CS102` splits one batch into two blocks - the
 * whole reason the USN is captured separately.
 */
export function normalizeUsn(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase()
}

/** Whether the value looks like a USN, once normalized. */
export function isValidUsn(value: string): boolean {
  return USN_PATTERN.test(normalizeUsn(value))
}
