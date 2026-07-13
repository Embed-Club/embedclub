'use client'

import { type FormAnswers, type SubmitFormResult, submitForm } from '@/app/(frontend)/forms/actions'
import { cutoutCardSurfaceShadowClassName } from '@/components/common/cutoutCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Form } from '@/payload/payload-types'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

type Step = NonNullable<Form['steps']>[number]
type Field = NonNullable<Step['fields']>[number]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function entryKey(field: Field): string {
  const raw = field.googleEntryId.trim()
  return raw.startsWith('entry.') ? raw : `entry.${raw}`
}

interface FormWizardProps {
  form: Form
  /** Rendered inside the success screen (e.g. certificate download). */
  successExtra?: React.ReactNode
}

export function FormWizard({ form, successExtra }: FormWizardProps) {
  const steps = form.steps ?? []
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitFormResult | null>(null)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const setAnswer = (key: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validateStep = (): boolean => {
    const next: Record<string, string> = {}
    for (const field of step?.fields ?? []) {
      const key = entryKey(field)
      const value = answers[key]
      const empty =
        value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
      if (field.required && empty) {
        next[key] = `${field.label} is required`
      } else if (
        field.fieldType === 'email' &&
        typeof value === 'string' &&
        value !== '' &&
        !EMAIL_RE.test(value)
      ) {
        next[key] = 'Enter a valid email address'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStepIndex((i) => Math.min(steps.length - 1, i + 1))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    const res = await submitForm(form.slug, answers)
    setSubmitting(false)
    if (res.success) {
      setResult(res)
    } else if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
      setErrors(res.fieldErrors)
      // jump back to the first step containing an error
      const errKeys = Object.keys(res.fieldErrors)
      const idx = steps.findIndex((s) =>
        (s.fields ?? []).some((f) => errKeys.includes(entryKey(f))),
      )
      if (idx >= 0) setStepIndex(idx)
    } else {
      setResult(res)
    }
  }

  // ── Success / failure screen ────────────────────────────────────────────
  if (result) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-card p-8 md:p-12 text-center space-y-6',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
            result.success ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive',
          )}
        >
          <Check className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {result.success ? 'Response Recorded' : 'Submission Failed'}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">{result.message}</p>
        </div>
        {result.success && successExtra}
        {!result.success && (
          <Button onClick={() => setResult(null)} variant="outline">
            Try again
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Stepper header ─────────────────────────────────────────────── */}
      <nav aria-label="Form steps" className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((s, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'
          return (
            <div key={s.id ?? i} className="flex items-center gap-2 md:gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    state === 'current' && 'bg-primary text-primary-foreground',
                    state === 'done' && 'bg-primary/20 text-primary',
                    state === 'todo' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {state === 'done' ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {/* labels: current step only on mobile, all on desktop */}
                <span
                  className={cn(
                    'min-w-0 flex-col leading-tight',
                    state === 'current' ? 'flex' : 'hidden md:flex',
                  )}
                >
                  <span
                    className={cn(
                      'truncate text-sm font-semibold',
                      state === 'todo' && 'text-muted-foreground',
                    )}
                  >
                    {s.stepTitle}
                  </span>
                  {s.stepDescription && (
                    <span className="truncate text-xs text-muted-foreground">
                      {s.stepDescription}
                    </span>
                  )}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Step card ──────────────────────────────────────────────────── */}
      <div className={cn('rounded-2xl bg-card p-6 md:p-10', cutoutCardSurfaceShadowClassName)}>
        <div className="mb-8 space-y-1">
          <h2 className="text-xl md:text-2xl font-bold">{step?.stepTitle}</h2>
          {step?.stepDescription && (
            <p className="text-sm text-muted-foreground">{step.stepDescription}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          {(step?.fields ?? []).map((field) => (
            <WizardField
              key={entryKey(field)}
              field={field}
              value={answers[entryKey(field)]}
              error={errors[entryKey(field)]}
              onChange={(v) => setAnswer(entryKey(field), v)}
            />
          ))}
        </div>

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0 || submitting}
            className={cn(stepIndex === 0 && 'invisible')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {isLast ? (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single field renderer ─────────────────────────────────────────────────

interface WizardFieldProps {
  field: Field
  value: string | string[] | undefined
  error?: string
  onChange: (value: string | string[]) => void
}

function WizardField({ field, value, error, onChange }: WizardFieldProps) {
  const id = entryKey(field)
  const options = (field.options ?? []).map((o) => o.option)
  const str = typeof value === 'string' ? value : ''
  const arr = Array.isArray(value) ? value : []

  const control = (() => {
    switch (field.fieldType) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            value={str}
            placeholder={field.placeholder || undefined}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        )
      case 'select':
        return (
          <Select value={str || undefined} onValueChange={onChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder={field.placeholder || 'Select…'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'radio':
        return (
          <RadioGroup value={str} onValueChange={onChange} className="gap-3 pt-1">
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem id={`${id}-${opt}`} value={opt} />
                <Label htmlFor={`${id}-${opt}`} className="font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case 'checkbox':
        return (
          <div className="flex flex-col gap-3 pt-1">
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${opt}`}
                  checked={arr.includes(opt)}
                  onCheckedChange={(checked) =>
                    onChange(checked ? [...arr, opt] : arr.filter((v) => v !== opt))
                  }
                />
                <Label htmlFor={`${id}-${opt}`} className="font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        )
      default: {
        const inputType =
          field.fieldType === 'email'
            ? 'email'
            : field.fieldType === 'number'
              ? 'number'
              : field.fieldType === 'phone'
                ? 'tel'
                : field.fieldType === 'date'
                  ? 'date'
                  : 'text'
        return (
          <Input
            id={id}
            type={inputType}
            value={str}
            placeholder={field.placeholder || undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    }
  })()

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2',
      )}
    >
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>
        {field.label}
        {field.required && <span className="text-primary"> *</span>}
      </Label>
      {control}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
