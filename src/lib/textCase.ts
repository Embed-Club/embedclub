export type NameCase = 'asTyped' | 'upper' | 'title'

function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Applies a form's chosen name-case convention (see `forms.certificateNameCase`). */
export function applyNameCase(value: string, mode: NameCase | null | undefined): string {
  switch (mode) {
    case 'upper':
      return value.toUpperCase()
    case 'title':
      return toTitleCase(value)
    default:
      return value
  }
}
