/**
 * Google Form HTML Parser
 * Safely extracts structure from public Google Forms and converts it
 * into Embed Club's Steps & Questions schema.
 */

export interface ParsedOption {
  option: string
}

export interface ParsedField {
  label: string
  fieldType:
    | 'text'
    | 'email'
    | 'phone'
    | 'number'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'imageUpload'
  required: boolean
  role: 'none' | 'name' | 'email' | 'usn'
  width: 'full' | 'half'
  helpText?: string
  placeholder?: string
  options?: ParsedOption[]
}

export interface ParsedStep {
  stepTitle: string
  stepDescription?: string
  fields: ParsedField[]
}

export interface ParsedGoogleForm {
  title: string
  description?: string
  steps: ParsedStep[]
}

function parseOptions(optionsRaw: unknown): ParsedOption[] {
  if (!Array.isArray(optionsRaw)) return []
  return optionsRaw
    .filter((opt): opt is [unknown] => Array.isArray(opt) && Boolean(opt[0]))
    .map((opt) => ({ option: String(opt[0]).trim() }))
    .filter((opt) => opt.option.length > 0)
}

export function parseGoogleFormHtml(html: string): ParsedGoogleForm {
  const match =
    html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);\s*<\/script>/s) ||
    html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);/s)

  if (!match?.[1]) {
    throw new Error(
      'Could not find Google Form data in the provided page. Make sure the form is public.',
    )
  }

  let rawData: unknown
  try {
    rawData = JSON.parse(match[1])
  } catch {
    throw new Error('Failed to parse Google Form data structure.')
  }

  if (!Array.isArray(rawData) || !Array.isArray(rawData[1])) {
    throw new Error('Unexpected Google Form format.')
  }

  const formData = rawData[1] as unknown[]

  const title = String(formData[8] || formData[0] || 'Imported Google Form').trim()
  const description = String(formData[1] || '').trim()

  const items = (Array.isArray(formData[1]) ? formData[1] : []) as unknown[]
  const steps: ParsedStep[] = []
  let currentStep: ParsedStep = {
    stepTitle: 'Step 1',
    fields: [],
  }

  for (const item of items) {
    if (!Array.isArray(item)) continue

    const itemTitle = String(item[1] || '').trim()
    const itemDescription = String(item[2] || '').trim()
    const itemType = Number(item[3])

    // Type 8 is PAGE_BREAK (Section break in Google Forms)
    if (itemType === 8) {
      if (currentStep.fields.length > 0) {
        steps.push(currentStep)
      }
      currentStep = {
        stepTitle: itemTitle || `Step ${steps.length + 1}`,
        stepDescription: itemDescription || undefined,
        fields: [],
      }
      continue
    }

    // Skip section headers or purely decorative text items without questions
    if (!Array.isArray(item[4]) || item[4].length === 0) {
      continue
    }

    const questionDetails = item[4][0]
    if (!Array.isArray(questionDetails)) continue

    const isRequired = Boolean(questionDetails[2] === 1 || questionDetails[2] === true)
    const optionsRaw = questionDetails[1]

    const field: ParsedField = {
      label: itemTitle || 'Untitled Question',
      fieldType: 'text',
      required: isRequired,
      role: 'none',
      width: 'full',
      helpText: itemDescription || undefined,
    }

    // Smart role & width detection based on question wording
    const lower = itemTitle.toLowerCase()
    if (/\b(usn|university seat number)\b/i.test(lower)) {
      field.role = 'usn'
      field.width = 'half'
      field.placeholder = 'e.g. 1PA22CS001'
    } else if (/\b(full name|name of student|candidate name|your name)\b/i.test(lower)) {
      field.role = 'name'
      field.width = 'half'
    } else if (/\b(email|email address|e-mail)\b/i.test(lower)) {
      field.role = 'email'
      field.fieldType = 'email'
      field.width = 'half'
      field.placeholder = 'name@example.com'
    } else if (/\b(phone|mobile|whatsapp|contact number)\b/i.test(lower)) {
      field.fieldType = 'phone'
      field.width = 'half'
    }

    // Map Google Form question types
    switch (itemType) {
      case 0: // Short text
        if (field.fieldType !== 'email' && field.fieldType !== 'phone') {
          field.fieldType = 'text'
        }
        break

      case 1: // Paragraph
        field.fieldType = 'textarea'
        field.width = 'full'
        break

      case 2: // Multiple Choice (Radio)
        field.fieldType = 'radio'
        field.options = parseOptions(optionsRaw)
        break

      case 3: // Dropdown
        field.fieldType = 'select'
        field.options = parseOptions(optionsRaw)
        break

      case 4: // Checkboxes
        field.fieldType = 'checkbox'
        field.options = parseOptions(optionsRaw)
        break

      case 5: // Linear Scale (1 to 5, etc.) -> Convert to Radio to ensure full compatibility
        field.fieldType = 'radio'
        field.options = [
          { option: '1' },
          { option: '2' },
          { option: '3' },
          { option: '4' },
          { option: '5' },
        ]
        break

      case 9: // Date
        field.fieldType = 'date'
        field.width = 'half'
        break

      case 10: // Time -> Map to Short Text with placeholder
        field.fieldType = 'text'
        field.width = 'half'
        field.placeholder = 'HH:MM (e.g. 10:30 AM)'
        break

      case 13: // File Upload
        field.fieldType = 'imageUpload'
        break

      default:
        field.fieldType = 'text'
        break
    }

    currentStep.fields.push(field)
  }

  if (currentStep.fields.length > 0) {
    steps.push(currentStep)
  }

  // Fallback step if form had no questions
  if (steps.length === 0) {
    steps.push({
      stepTitle: 'Step 1',
      fields: [
        {
          label: 'Name',
          fieldType: 'text',
          required: true,
          role: 'name',
          width: 'half',
        },
      ],
    })
  }

  return {
    title,
    description: description || undefined,
    steps,
  }
}
