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
import { USN_FORMAT_HINT, isValidUsn } from '@/lib/usn'
import { cn } from '@/lib/utils'
import type { Form } from '@/payload/payload-types'
import { ArrowLeft, ArrowRight, Check, ChevronRight, ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { FormImage } from './formImage'

type Step = NonNullable<Form['steps']>[number]
type Field = NonNullable<Step['fields']>[number]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Answers are keyed by the field row's Payload id, which is stable across
 * label edits. (It replaced the Google Form `entry.<id>` key in 2026-07.)
 */
function fieldKey(field: Field): string {
  return field.id ?? ''
}

/**
 * Fallback for the consent line, used until an officer writes one in the CMS.
 * The label appends a link to the policy, so the sentence is written to lead
 * into it rather than to end.
 */
const DEFAULT_CONSENT_NOTICE =
  'I agree that Embed Club may store the details I have entered here, and use them to contact me about this event and to issue my certificate. See the'

interface FormWizardProps {
  form: Form
  /** The consent sentence from the Legal Pages global. */
  consentNotice?: string | null
}

export function FormWizard({ form, consentNotice }: FormWizardProps) {
  const steps = form.steps ?? []
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  // Field ids with a photo still going to Drive. Moving on mid-upload would
  // submit an answer whose file does not exist yet.
  const [uploading, setUploading] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<SubmitFormResult | null>(null)
  // Bots fill every field they find; people never see this one.
  const [honeypot, setHoneypot] = useState('')
  // Consent is per-submission, not a question on the form: it is asked once, on
  // the last step, right above the button that sends the answers.
  const [consented, setConsented] = useState(false)
  const [consentError, setConsentError] = useState(false)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const busyUploading = uploading.size > 0

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
      // Image rows are decoration — nothing to fill in, nothing to check.
      if (field.fieldType === 'image') continue
      const key = fieldKey(field)
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
      } else if (
        field.role === 'usn' &&
        typeof value === 'string' &&
        value !== '' &&
        !isValidUsn(value)
      ) {
        // Checked here as well as on the server so a typo is caught on the step
        // it was made on, rather than after the whole form is submitted.
        next[key] = `Enter a valid USN — ${USN_FORMAT_HINT}`
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
    if (!consented) {
      setConsentError(true)
      return
    }
    setSubmitting(true)
    const res = await submitForm(form.slug, answers, honeypot, consented)
    setSubmitting(false)
    if (res.success) {
      setResult(res)
    } else if (res.consentError) {
      setConsentError(true)
    } else if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
      setErrors(res.fieldErrors)
      // jump back to the first step containing an error
      const errKeys = Object.keys(res.fieldErrors)
      const idx = steps.findIndex((s) =>
        (s.fields ?? []).some((f) => errKeys.includes(fieldKey(f))),
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
        <div className="mb-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold">{step?.stepTitle}</h2>
            {step?.stepDescription && (
              <p className="text-sm text-muted-foreground">{step.stepDescription}</p>
            )}
          </div>
          <FormImage media={step?.stepImage} slot="step" />
        </div>

        {/* Honeypot: off-screen rather than display:none, which some bots skip.
            aria-hidden + tabIndex -1 keep it away from real users entirely.

            The name is deliberately meaningless. It used to be
            "company-website", which is exactly what a browser or password
            manager matches when it autofills an organisation URL — and a filled
            honeypot silently bins the submission. The data-* attributes opt out
            of the major password managers for the same reason. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor="hp-control">Leave this field empty</label>
          <input
            id="hp-control"
            name="hp-control"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          {(step?.fields ?? []).map((field) => (
            <WizardField
              key={fieldKey(field)}
              field={field}
              formSlug={form.slug}
              value={answers[fieldKey(field)]}
              error={errors[fieldKey(field)]}
              onChange={(v) => setAnswer(fieldKey(field), v)}
              onUploadingChange={(busy) =>
                setUploading((prev) => {
                  const next = new Set(prev)
                  if (busy) next.add(fieldKey(field))
                  else next.delete(fieldKey(field))
                  return next
                })
              }
            />
          ))}
        </div>

        {/* ── Consent ────────────────────────────────────────────────────
            Only on the last step, so it sits with the button that actually
            sends the answers rather than being agreed to three steps early. */}
        {isLast && (
          <div
            className={cn(
              'mt-10 flex items-start gap-3 rounded-xl border p-4',
              consentError ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/40',
            )}
          >
            <Checkbox
              id="form-consent"
              checked={consented}
              onCheckedChange={(checked) => {
                setConsented(checked === true)
                if (checked === true) setConsentError(false)
              }}
              className="mt-0.5"
              aria-describedby={consentError ? 'form-consent-error' : undefined}
            />
            <div className="space-y-1">
              <Label htmlFor="form-consent" className="text-sm font-normal leading-relaxed">
                {consentNotice?.trim() || DEFAULT_CONSENT_NOTICE}{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Privacy Policy
                </a>
                .
              </Label>
              {consentError && (
                <p id="form-consent-error" className="text-sm text-destructive">
                  Tick this to submit your response.
                </p>
              )}
            </div>
          </div>
        )}

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
            <Button type="button" onClick={handleSubmit} disabled={submitting || busyUploading}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Submitting…' : busyUploading ? 'Uploading photo…' : 'Submit'}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} disabled={busyUploading}>
              {busyUploading ? 'Uploading photo…' : 'Next'}
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
  formSlug: string
  value: string | string[] | undefined
  error?: string
  onChange: (value: string | string[]) => void
  onUploadingChange: (busy: boolean) => void
}

function WizardField({
  field,
  formSlug,
  value,
  error,
  onChange,
  onUploadingChange,
}: WizardFieldProps) {
  const id = fieldKey(field)
  const options = (field.options ?? []).map((o) => o.option)
  const str = typeof value === 'string' ? value : ''
  const arr = Array.isArray(value) ? value : []

  // A standalone image row is the whole cell — no label, no control, no
  // required marker. It exists to show a poster or a payment QR mid-form.
  if (field.fieldType === 'image') {
    return (
      <div className={cn(field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2')}>
        <FormImage media={field.displayImage} slot="standalone" caption={field.label} />
        {field.helpText && <p className="mt-2 text-xs text-muted-foreground">{field.helpText}</p>}
      </div>
    )
  }

  const control = (() => {
    switch (field.fieldType) {
      case 'imageUpload':
        return (
          <ImageUploadControl
            fieldId={id}
            formSlug={formSlug}
            value={str}
            onChange={onChange}
            onUploadingChange={onUploadingChange}
          />
        )
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
      <FormImage media={field.image} slot="question" />
      {control}
      {field.helpText && !error && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Respondent photo upload ───────────────────────────────────────────────

interface ImageUploadControlProps {
  fieldId: string
  formSlug: string
  value: string
  onChange: (value: string) => void
  onUploadingChange: (busy: boolean) => void
}

/**
 * Sends the picked image straight to the form's Google Drive folder and keeps
 * only the returned file id as the answer — nothing is uploaded to this site.
 *
 * The preview is a local object URL, so it costs no round trip: the file we
 * just read is already in the browser. Nobody but an officer can read it back
 * from Drive afterwards, which is the point.
 */
function ImageUploadControl({
  fieldId,
  formSlug,
  value,
  onChange,
  onUploadingChange,
}: ImageUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const handlePick = async (file: File | undefined) => {
    if (!file) return

    setFailure(null)
    setBusy(true)
    onUploadingChange(true)

    // Revoke the previous preview before replacing it, or a respondent who
    // re-picks a few times leaks a blob per attempt.
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { url: URL.createObjectURL(file), name: file.name }
    })

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('formSlug', formSlug)
      body.append('fieldId', fieldId)

      const res = await fetch('/api/form-uploads', { method: 'POST', body })
      const json = (await res.json()) as { id?: string; error?: string }

      if (!res.ok || !json.id) {
        throw new Error(json.error || 'Upload failed — please try again.')
      }
      onChange(json.id)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Upload failed — please try again.')
      onChange('')
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
    } finally {
      setBusy(false)
      onUploadingChange(false)
    }
  }

  const clear = () => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    setFailure(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />

      {preview && (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          {/* Plain <img>: a blob: URL from the file the user just picked, which
              next/image cannot optimise. */}
          <img src={preview.url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          <span className="min-w-0 flex-1 truncate text-sm">{preview.name}</span>
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : value ? (
            <Check className="h-4 w-4 shrink-0 text-primary" />
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {value ? 'Replace photo' : 'Choose photo'}
        </Button>
        {value && !busy && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Remove
          </Button>
        )}
      </div>

      {failure && <p className="text-xs text-destructive">{failure}</p>}
    </div>
  )
}
