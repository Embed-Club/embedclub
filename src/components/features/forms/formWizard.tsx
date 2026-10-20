'use client'

import { type SubmitFormResult, submitForm } from '@/app/(frontend)/forms/actions'
import { ScrollContainerContext } from '@/components/layout/scrollContainerContext'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  type FormAnswer,
  type FormAnswers,
  answerError,
  isDisplayOnly,
  nextStep,
} from '@/lib/formAnswers'
import { USN_FORMAT_HINT, isValidUsn } from '@/lib/usn'
import { cn } from '@/lib/utils'
import type { Form } from '@/payload/payload-types'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { FormHeader } from './formHeader'
import { FormImage } from './formImage'
import { FormQuestion } from './formQuestion'
import { LinkifiedText } from './linkifiedText'

/**
 * Fallback for the consent line, used until a member writes one in the CMS.
 * The label appends a link to the policy, so the sentence leads into it.
 */
const DEFAULT_CONSENT_NOTICE =
  'I agree that Embed Club may store the details I have entered here, and use them to contact me about this event and to issue my certificate. See the'

interface FormWizardProps {
  form: Form
  /** The consent sentence from the Legal Pages global. */
  consentNotice?: string | null
  /** Overrides the header title - a section shows its own label. */
  title?: string
  /** Above the header title - a section links back to its parent here. */
  above?: ReactNode
}

const draftKey = (slug: string) => `form-draft:${slug}`

/**
 * A form, the way Google Forms runs one: a header card, one card per question,
 * pages with a progress bar, "go to page based on answer", and Back/Next that
 * retrace the route actually taken.
 *
 * Unsent answers are kept in this browser, so a respondent who reloads or
 * comes back later picks up where they left off. Uploaded file ids are kept
 * too; the server re-verifies them on submit, so a stale one is just asked for
 * again.
 */
export function FormWizard({ form, consentNotice, title, above }: FormWizardProps) {
  const scrollContainer = useContext(ScrollContainerContext)
  const steps = form.steps ?? []
  // The pages visited so far, in order - Back pops this rather than going to
  // page n-1, because a branch may have skipped pages in between.
  const [history, setHistory] = useState<number[]>([0])
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<SubmitFormResult | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [consented, setConsented] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const restored = useRef(false)

  const page = history[history.length - 1] ?? 0
  const step = steps[page]
  const next = nextStep(steps, page, answers)
  const isLast = next === 'submit'
  const busyUploading = uploading.size > 0
  const hasRequired = steps.some((s) => (s.fields ?? []).some((f) => f.required))
  const headerTitle = title ?? form.title

  // Restore a draft after mount - reading storage during render would differ
  // from the server's HTML.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey(form.slug))
      if (saved) setAnswers(JSON.parse(saved) as FormAnswers)
    } catch {
      // Private mode or blocked storage: start empty.
    }
    restored.current = true
  }, [form.slug])

  useEffect(() => {
    if (!restored.current) return
    try {
      if (Object.keys(answers).length === 0) window.localStorage.removeItem(draftKey(form.slug))
      else window.localStorage.setItem(draftKey(form.slug), JSON.stringify(answers))
    } catch {
      // Storage is a convenience; the form works without it.
    }
  }, [answers, form.slug])

  const scrollTo = (el: Element | null) => {
    if (!el) return
    if (scrollContainer) {
      const top =
        el.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop -
        24
      scrollContainer.scrollTo({ top, behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const setAnswer = (key: string, value: FormAnswer) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  const validatePage = (): boolean => {
    const found: Record<string, string> = {}
    for (const field of step?.fields ?? []) {
      if (isDisplayOnly(field) || !field.id) continue
      const value = answers[field.id]
      const problem = answerError(field, value)
      if (problem) found[field.id] = problem
      else if (field.role === 'usn' && typeof value === 'string' && value && !isValidUsn(value)) {
        found[field.id] = `Enter a valid USN - ${USN_FORMAT_HINT}`
      }
    }
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) scrollTo(document.querySelector(`[data-question="${first}"]`))
    return !first
  }

  const goNext = () => {
    if (!validatePage() || next === 'submit') return
    setHistory((h) => [...h, next])
    scrollTo(topRef.current)
  }

  const goBack = () => {
    setErrors({})
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
    scrollTo(topRef.current)
  }

  const clearForm = () => {
    setAnswers({})
    setErrors({})
    setHistory([0])
    setConsented(false)
    setConfirmClear(false)
    scrollTo(topRef.current)
  }

  const handleSubmit = async () => {
    if (!validatePage()) return
    if (!consented) {
      setConsentError(true)
      return
    }
    setSubmitting(true)
    const res = await submitForm(form.slug, answers, honeypot, consented)
    setSubmitting(false)

    if (res.success) {
      setResult(res)
      try {
        window.localStorage.removeItem(draftKey(form.slug))
      } catch {}
      scrollTo(topRef.current)
      return
    }
    if (res.consentError) {
      setConsentError(true)
      return
    }
    if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
      setErrors(res.fieldErrors)
      const keys = Object.keys(res.fieldErrors)
      const at = history.find((p) =>
        (steps[p]?.fields ?? []).some((f) => keys.includes(f.id ?? '')),
      )
      if (at !== undefined) setHistory((h) => h.slice(0, h.indexOf(at) + 1))
      return
    }
    setResult(res)
  }

  if (result) {
    return (
      <div ref={topRef} className="space-y-4">
        <FormHeader title={headerTitle} headerImage={form.headerImage} above={above} />
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8" aria-live="polite">
          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7 shrink-0 text-primary" />
                <h2 className="text-xl font-extrabold">Response recorded</h2>
              </div>
              <LinkifiedText text={result.message} className="text-[15px] leading-relaxed" />
              {result.certificate && (
                <p className="text-sm text-muted-foreground">
                  Your certificate is being emailed to you now. Check your spam folder if it has not
                  arrived in a few minutes.
                </p>
              )}
              {form.allowAnotherResponse && (
                <button
                  type="button"
                  onClick={() => {
                    clearForm()
                    setResult(null)
                  }}
                  className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Submit another response
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold">Your response was not sent</h2>
              <p className="text-[15px]">{result.message}</p>
              <Button variant="outline" onClick={() => setResult(null)}>
                Back to the form
              </Button>
            </div>
          )}
        </section>
      </div>
    )
  }

  const progress =
    steps.length > 1 ? Math.round(((isLast ? steps.length : page + 1) / steps.length) * 100) : 0
  const showStepCard =
    steps.length > 1 || Boolean(step?.stepDescription) || Boolean(step?.stepImage)

  return (
    <div ref={topRef} className="space-y-4">
      <FormHeader
        title={headerTitle}
        description={page === 0 ? form.description : null}
        headerImage={form.headerImage}
        above={above}
        showRequiredNote={page === 0 && hasRequired}
      />

      {form.showProgressBar !== false && steps.length > 1 && (
        <div
          className="flex items-center gap-3 px-1"
          aria-label={`Page ${page + 1} of ${steps.length}`}
        >
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            Page {page + 1} of {steps.length}
          </span>
        </div>
      )}

      {showStepCard && step && (
        <section className="rounded-2xl border border-border bg-card">
          {steps.length > 1 && (
            <div className="rounded-t-2xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground md:px-7">
              Section {page + 1} of {steps.length}
            </div>
          )}
          <div className="space-y-3 p-6 md:p-7">
            <h2 className="text-balance text-xl font-extrabold tracking-tight md:text-2xl">
              {step.stepTitle}
            </h2>
            <LinkifiedText text={step.stepDescription} className="text-[15px] text-foreground/85" />
            <FormImage media={step.stepImage} slot="step" />
          </div>
        </section>
      )}

      {/* Honeypot: off-screen rather than display:none, which some bots skip.
          The name is deliberately meaningless - a browser that autofills an
          organisation URL into "company-website" silently binned real answers. */}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(step?.fields ?? []).map((field) => (
          <FormQuestion
            key={field.id ?? field.label}
            field={field}
            formSlug={form.slug}
            value={answers[field.id ?? '']}
            error={errors[field.id ?? '']}
            onChange={(v) => setAnswer(field.id ?? '', v)}
            onUploadingChange={(busy) =>
              setUploading((prev) => {
                const copy = new Set(prev)
                if (busy) copy.add(field.id ?? '')
                else copy.delete(field.id ?? '')
                return copy
              })
            }
          />
        ))}
      </div>

      {/* Consent sits on the page that submits, next to the button that sends. */}
      {isLast && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border bg-card p-5 md:p-6',
            consentError ? 'border-destructive ring-1 ring-destructive' : 'border-border',
          )}
        >
          <Checkbox
            id="form-consent"
            checked={consented}
            onCheckedChange={(checked) => {
              setConsented(checked === true)
              if (checked === true) setConsentError(false)
            }}
            className="mt-0.5 h-5 w-5"
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
              <p id="form-consent-error" className="text-sm text-destructive dark:text-foreground">
                Tick this to submit your response.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {history.length > 1 && (
          <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
            Back
          </Button>
        )}
        {isLast ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || busyUploading}
            className="min-w-28"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting…' : busyUploading ? 'Uploading…' : 'Submit'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={busyUploading} className="min-w-28">
            {busyUploading ? 'Uploading…' : 'Next'}
          </Button>
        )}
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="ml-auto rounded-md px-2 py-1 text-sm text-primary hover:bg-accent/50"
        >
          Clear form
        </button>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Clear form?</DialogTitle>
            <DialogDescription>
              This removes your answers from every page and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button onClick={clearForm}>Clear form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
