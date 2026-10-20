'use client'

import { FieldDescription, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useEffect, useMemo, useState } from 'react'

type Question = { label: string; fieldType: string; options: string[] }
type FormDoc = {
  steps?: { fields?: { label?: string; fieldType?: string; options?: { option?: string }[] }[] }[]
  sectionOf?: FormDoc | number | null
}

/** Types that hold an answer worth printing or matching on. */
const DISPLAY_ONLY = ['image', 'sectionText', 'video', 'imageUpload']

function questionsOf(form: FormDoc | null): Question[] {
  const source =
    form?.sectionOf && typeof form.sectionOf === 'object' ? form.sectionOf : (form ?? undefined)
  const out: Question[] = []
  for (const step of source?.steps ?? []) {
    for (const field of step.fields ?? []) {
      if (!field.label || DISPLAY_ONLY.includes(field.fieldType ?? '')) continue
      if (out.some((q) => q.label === field.label)) continue
      out.push({
        label: field.label,
        fieldType: field.fieldType ?? 'text',
        options: (field.options ?? []).map((o) => o.option ?? '').filter(Boolean),
      })
    }
  }
  return out
}

/** Forms fetched once per page, however many pickers ask. */
const cache = new Map<number, Promise<FormDoc | null>>()
function loadForm(id: number): Promise<FormDoc | null> {
  let hit = cache.get(id)
  if (!hit) {
    hit = fetch(`/api/forms/${id}?depth=1`, { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<FormDoc>) : null))
      .catch(() => null)
    cache.set(id, hit)
  }
  return hit
}

/**
 * Picks a question - or an answer to one - from the form the certificate is
 * linked to, so nothing has to be retyped from the form. Stores the question's
 * label, which is how answers are keyed.
 *
 * `mode: 'answer'` reads the question chosen in a sibling field (`questionField`)
 * and offers that question's options. For a question with free-text answers it
 * falls back to a text box.
 */
const FormQuestionSelect: TextFieldClientComponent = (props) => {
  const { path, field } = props
  const { mode = 'question', questionField } = props as unknown as {
    mode?: 'question' | 'answer'
    questionField?: string
  }
  const { value, setValue } = useField<string>({ path })

  const formValue = useFormFields(([fields]) => fields.form?.value)
  const formId = Number(
    typeof formValue === 'object' && formValue !== null && 'id' in formValue
      ? (formValue as { id: unknown }).id
      : formValue,
  )
  const siblingPath = questionField ? path.replace(/[^.]+$/, questionField) : ''
  const chosenQuestion = useFormFields(([fields]) =>
    siblingPath ? (fields[siblingPath]?.value as string | undefined) : undefined,
  )

  const [form, setForm] = useState<FormDoc | null>(null)
  useEffect(() => {
    if (!formId) return
    let live = true
    loadForm(formId).then((doc) => live && setForm(doc))
    return () => {
      live = false
    }
  }, [formId])

  const questions = useMemo(() => questionsOf(form), [form])
  const choices = useMemo(() => {
    if (mode === 'question') return questions.map((q) => q.label)
    return questions.find((q) => q.label === chosenQuestion)?.options ?? []
  }, [mode, questions, chosenQuestion])

  const label = typeof field.label === 'string' ? field.label : field.name
  const description = field.admin?.description
  const inputId = `field-${path.replace(/\./g, '__')}`
  const current = value ?? ''
  const freeText = mode === 'answer' && choices.length === 0

  return (
    <div className="field-type text" style={{ flex: '1 1 auto' }}>
      <FieldLabel htmlFor={inputId} label={label} required={field.required} />
      <div className="field-type__wrap">
        {freeText ? (
          <input
            id={inputId}
            type="text"
            value={current}
            onChange={(e) => setValue(e.target.value)}
            placeholder={chosenQuestion ? 'Type the answer' : 'Pick the question first'}
          />
        ) : (
          <select
            id={inputId}
            value={current}
            onChange={(e) => setValue(e.target.value)}
            disabled={!formId}
            style={{
              width: '100%',
              minHeight: 40,
              padding: '0 12px',
              borderRadius: 'var(--style-radius-s)',
              border: '1px solid var(--theme-elevation-150)',
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
            }}
          >
            <option value="">
              {!formId ? 'Pick the form first' : form ? 'Choose…' : 'Loading questions…'}
            </option>
            {/* A saved value the form no longer has - kept visible, not silently dropped. */}
            {current && !choices.includes(current) && (
              <option value={current}>{current} (no longer on the form)</option>
            )}
            {choices.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        )}
      </div>
      {typeof description === 'string' && (
        <FieldDescription description={description} path={path} />
      )}
    </div>
  )
}

export default FormQuestionSelect
