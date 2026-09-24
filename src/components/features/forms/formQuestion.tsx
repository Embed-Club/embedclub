'use client'

import { youTubeId } from '@/components/features/resources/blocks/videoBlock'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Field, FormAnswer, GridAnswer } from '@/lib/formAnswers'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import {
  CheckboxChoices,
  ChoiceGrid,
  LinearScale,
  RadioChoices,
  StarRating,
  useOptionOrder,
} from './choiceControls'
import { FileUploadControl } from './fileUploadControl'
import { FormImage } from './formImage'
import { LinkifiedText } from './linkifiedText'

interface FormQuestionProps {
  field: Field
  formSlug: string
  value: FormAnswer | undefined
  error?: string
  onChange: (value: FormAnswer) => void
  onUploadingChange: (busy: boolean) => void
}

/** The line under an input, Google-style: underline only, copper when focused. */
const LINE_INPUT =
  'h-11 rounded-none border-0 border-b border-border bg-transparent px-1 text-[15px] shadow-none focus-visible:border-b-2 focus-visible:border-primary focus-visible:ring-0'

/**
 * One item on the form, in its own card - a question, or a title, picture or
 * video between questions. Questions follow Google Forms' layout: label with
 * its asterisk, description, optional picture, then the answer.
 */
export function FormQuestion({
  field,
  formSlug,
  value,
  error,
  onChange,
  onUploadingChange,
}: FormQuestionProps) {
  const id = field.id ?? ''
  const span = field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2'

  if (field.fieldType === 'sectionText') {
    return (
      <section className={cn('rounded-2xl border border-border bg-card p-6 md:p-7', span)}>
        <h3 className="text-xl font-extrabold tracking-tight">{field.label}</h3>
        <LinkifiedText
          text={field.helpText}
          className="mt-2 text-[15px] leading-relaxed text-foreground/85"
        />
      </section>
    )
  }

  if (field.fieldType === 'image') {
    return (
      <figure className={cn('rounded-2xl border border-border bg-card p-4 md:p-6', span)}>
        {field.label && <figcaption className="mb-3 font-semibold">{field.label}</figcaption>}
        <FormImage media={field.displayImage} slot="standalone" />
        <LinkifiedText text={field.helpText} className="mt-3 text-sm text-muted-foreground" />
      </figure>
    )
  }

  if (field.fieldType === 'video') {
    const videoId = youTubeId(field.videoUrl ?? '')
    return (
      <section className={cn('rounded-2xl border border-border bg-card p-4 md:p-6', span)}>
        {field.label && <h3 className="mb-3 font-semibold">{field.label}</h3>}
        {videoId && (
          <div className="aspect-video overflow-hidden rounded-xl bg-muted">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={field.label || 'Video'}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
        <LinkifiedText text={field.helpText} className="mt-3 text-sm text-muted-foreground" />
      </section>
    )
  }

  const str = typeof value === 'string' ? value : ''
  const arr = Array.isArray(value) ? value : []
  const grid = (
    value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  ) as GridAnswer
  const labelId = `${id}-label`

  return (
    <fieldset
      aria-labelledby={labelId}
      aria-invalid={Boolean(error)}
      data-question={id}
      className={cn(
        'min-w-0 rounded-2xl border bg-card p-6 transition-colors md:p-7',
        'focus-within:border-primary/60',
        error ? 'border-destructive ring-1 ring-destructive' : 'border-border',
        span,
      )}
    >
      <legend className="sr-only">{field.label}</legend>
      <div className="mb-4 space-y-1.5">
        <p id={labelId} className="text-base font-medium leading-snug">
          {field.label}
          {field.required && (
            <span className="text-primary" aria-label="required">
              {' '}
              *
            </span>
          )}
        </p>
        <LinkifiedText text={field.helpText} className="text-sm text-muted-foreground" />
      </div>

      <FormImage media={field.image} slot="question" className="mb-4" />

      <Control
        field={field}
        id={id}
        labelId={labelId}
        formSlug={formSlug}
        str={str}
        arr={arr}
        grid={grid}
        onChange={onChange}
        onUploadingChange={onUploadingChange}
      />

      {error && (
        <p
          className="mt-4 flex items-center gap-2 text-sm text-destructive dark:text-foreground"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive dark:text-primary" />
          {error}
        </p>
      )}
    </fieldset>
  )
}

interface ControlProps {
  field: Field
  id: string
  labelId: string
  formSlug: string
  str: string
  arr: string[]
  grid: GridAnswer
  onChange: (value: FormAnswer) => void
  onUploadingChange: (busy: boolean) => void
}

function Control({
  field,
  id,
  labelId,
  formSlug,
  str,
  arr,
  grid,
  onChange,
  onUploadingChange,
}: ControlProps) {
  switch (field.fieldType) {
    case 'imageUpload':
      return (
        <FileUploadControl
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
          aria-labelledby={labelId}
          value={str}
          placeholder={field.placeholder || 'Your answer'}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="min-h-[88px] resize-y rounded-lg text-[15px]"
        />
      )
    case 'select':
      return (
        <DropdownControl field={field} id={id} labelId={labelId} value={str} onChange={onChange} />
      )
    case 'radio':
      return <RadioChoices field={field} id={id} value={str} onChange={onChange} />
    case 'checkbox':
      return <CheckboxChoices field={field} id={id} value={arr} onChange={onChange} />
    case 'linearScale':
      return <LinearScale field={field} id={id} value={str} onChange={onChange} />
    case 'rating':
      return <StarRating field={field} id={id} value={str} onChange={onChange} />
    case 'radioGrid':
    case 'checkboxGrid':
      return <ChoiceGrid field={field} id={id} value={grid} onChange={onChange} />
    default: {
      const type =
        field.fieldType === 'email'
          ? 'email'
          : field.fieldType === 'number'
            ? 'number'
            : field.fieldType === 'phone'
              ? 'tel'
              : field.fieldType === 'date'
                ? 'date'
                : field.fieldType === 'time'
                  ? 'time'
                  : 'text'
      const autoComplete =
        field.role === 'email' || type === 'email'
          ? 'email'
          : field.role === 'name'
            ? 'name'
            : type === 'tel'
              ? 'tel'
              : undefined
      return (
        <Input
          id={id}
          aria-labelledby={labelId}
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          autoComplete={autoComplete}
          value={str}
          placeholder={
            type === 'date' || type === 'time' ? undefined : field.placeholder || 'Your answer'
          }
          onChange={(e) => onChange(e.target.value)}
          className={cn(LINE_INPUT, (type === 'date' || type === 'time') && 'w-auto min-w-[12rem]')}
        />
      )
    }
  }
}

function DropdownControl({
  field,
  id,
  labelId,
  value,
  onChange,
}: {
  field: Field
  id: string
  labelId: string
  value: string
  onChange: (value: string) => void
}) {
  const options = useOptionOrder(field)
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} aria-labelledby={labelId} className="h-11 w-full max-w-sm">
        <SelectValue placeholder={field.placeholder || 'Choose'} />
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
}
