import { isValidUsn, normalizeUsn } from '@/lib/usn'
import { describe, expect, it } from 'vitest'

/**
 * The USN check runs on every submission to a form that asks for one, so a
 * pattern that is too strict turns away a real student at registration - the
 * failure nobody reports, they just give up. These cases pin the shapes the
 * club actually sees.
 */

describe('normalizeUsn', () => {
  it('upper-cases, so a sheet sorted on this keeps one batch together', () => {
    expect(normalizeUsn('4pa23cs102')).toBe('4PA23CS102')
  })

  it('strips spaces students type between the parts', () => {
    expect(normalizeUsn(' 4pa 23 cs102 ')).toBe('4PA23CS102')
  })
})

describe('isValidUsn', () => {
  it('accepts the full five-part form', () => {
    // 4 region · PA college · 23 batch · CS department · 102 student
    expect(isValidUsn('4PA23CS102')).toBe(true)
  })

  it('accepts one with no department letters', () => {
    expect(isValidUsn('9CN19034')).toBe(true)
  })

  it('accepts lower case, since it is normalized first', () => {
    expect(isValidUsn('4pa23cs102')).toBe(true)
  })

  it('rejects text that is not a seat number at all', () => {
    expect(isValidUsn('ABC123')).toBe(false)
    expect(isValidUsn('hello')).toBe(false)
    expect(isValidUsn('')).toBe(false)
  })

  it('rejects a number missing its college letters', () => {
    expect(isValidUsn('423CS102')).toBe(false)
  })

  it('rejects one padded with extra digits', () => {
    expect(isValidUsn('4PA23CS1020456')).toBe(false)
  })
})
