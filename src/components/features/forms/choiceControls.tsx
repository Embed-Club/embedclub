'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup'
import { type Field, type GridAnswer, scaleValues } from '@/lib/formAnswers'
import { cn } from '@/lib/utils'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Star } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useState } from 'react'

const OTHER = '__other__'

/**
 * The options in the order to show them. Shuffling happens after mount, not
 * during render: the server renders the form too, and a different random order
 * on each side would fail hydration.
 */
export function useOptionOrder(field: Field): string[] {
  const base = (field.options ?? []).map((o) => o.option)
  const [order, setOrder] = useState(base)
  const key = base.join('\u0000')
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands in for the options list
  useEffect(() => {
    const next = [...base]
    if (field.shuffleOptions) {
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
    }
    setOrder(next)
  }, [key, field.shuffleOptions])
  return order
}

interface ChoiceProps<T> {
  field: Field
  id: string
  value: T
  onChange: (value: T) => void
  invalid?: boolean
}

/** Multiple choice (one answer), with Google's optional "Other: ___". */
export function RadioChoices({ field, id, value, onChange }: ChoiceProps<string>) {
  const options = useOptionOrder(field)
  const isOther = Boolean(value) && !options.includes(value)
  const [otherPicked, setOtherPicked] = useState(isOther)
  const [otherText, setOtherText] = useState(isOther ? value : '')

  return (
    <div className="space-y-2">
      <RadioGroup
        value={otherPicked ? OTHER : value}
        onValueChange={(next) => {
          if (next === OTHER) {
            setOtherPicked(true)
            onChange(otherText)
          } else {
            setOtherPicked(false)
            onChange(next)
          }
        }}
        className="gap-1"
      >
        {options.map((opt) => (
          <Label
            key={opt}
            htmlFor={`${id}-${opt}`}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 font-normal transition-colors hover:bg-accent/50"
          >
            <RadioGroupItem id={`${id}-${opt}`} value={opt} className="h-5 w-5" />
            <span className="text-[15px]">{opt}</span>
          </Label>
        ))}
        {field.allowOther && (
          <div className="flex min-h-11 items-center gap-3 rounded-lg px-2">
            <RadioGroupItem id={`${id}-other`} value={OTHER} className="h-5 w-5" />
            <Label htmlFor={`${id}-other`} className="shrink-0 cursor-pointer font-normal">
              Other:
            </Label>
            <Input
              aria-label="Other answer"
              value={otherText}
              onFocus={() => {
                setOtherPicked(true)
                onChange(otherText)
              }}
              onChange={(e) => {
                setOtherText(e.target.value)
                setOtherPicked(true)
                onChange(e.target.value)
              }}
              className="h-9 border-0 border-b border-border rounded-none bg-transparent px-1 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>
        )}
      </RadioGroup>
      {!field.required && (value || otherPicked) && (
        <button
          type="button"
          onClick={() => {
            setOtherPicked(false)
            setOtherText('')
            onChange('')
          }}
          className="ml-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear selection
        </button>
      )}
    </div>
  )
}

/** Checkboxes (many answers), with an optional "Other: ___". */
export function CheckboxChoices({ field, id, value, onChange }: ChoiceProps<string[]>) {
  const options = useOptionOrder(field)
  const listed = value.filter((v) => options.includes(v))
  const existingOther = value.find((v) => !options.includes(v))
  const [otherPicked, setOtherPicked] = useState(existingOther !== undefined)
  const [otherText, setOtherText] = useState(existingOther ?? '')

  const emit = (nextListed: string[], picked: boolean, text: string) =>
    onChange(picked ? [...nextListed, text] : nextListed)

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <Label
          key={opt}
          htmlFor={`${id}-${opt}`}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 font-normal transition-colors hover:bg-accent/50"
        >
          <Checkbox
            id={`${id}-${opt}`}
            checked={listed.includes(opt)}
            onCheckedChange={(checked) =>
              emit(
                checked ? [...listed, opt] : listed.filter((v) => v !== opt),
                otherPicked,
                otherText,
              )
            }
          />
          <span className="text-[15px]">{opt}</span>
        </Label>
      ))}
      {field.allowOther && (
        <div className="flex min-h-11 items-center gap-3 rounded-lg px-2">
          <Checkbox
            id={`${id}-other`}
            checked={otherPicked}
            onCheckedChange={(checked) => {
              setOtherPicked(checked === true)
              emit(listed, checked === true, otherText)
            }}
          />
          <Label htmlFor={`${id}-other`} className="shrink-0 cursor-pointer font-normal">
            Other:
          </Label>
          <Input
            aria-label="Other answer"
            value={otherText}
            onChange={(e) => {
              setOtherText(e.target.value)
              setOtherPicked(true)
              emit(listed, true, e.target.value)
            }}
            className="h-9 border-0 border-b border-border rounded-none bg-transparent px-1 focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>
      )}
    </div>
  )
}

/** Linear scale: a row of numbers between two labels. */
export function LinearScale({ field, id, value, onChange }: ChoiceProps<string>) {
  const values = scaleValues(field)
  return (
    <div className="overflow-x-auto pb-1">
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex min-w-max items-end gap-1 sm:gap-2"
        aria-label={field.label}
      >
        {field.scaleMinLabel && (
          <span className="max-w-[7rem] self-center pr-2 text-right text-sm text-muted-foreground">
            {field.scaleMinLabel}
          </span>
        )}
        {values.map((n) => (
          <Label
            key={n}
            htmlFor={`${id}-${n}`}
            className="flex w-10 cursor-pointer flex-col items-center gap-2 rounded-lg py-2 font-normal transition-colors hover:bg-accent/50"
          >
            <span className="text-sm">{n}</span>
            <RadioGroupItem id={`${id}-${n}`} value={String(n)} className="h-5 w-5" />
          </Label>
        ))}
        {field.scaleMaxLabel && (
          <span className="max-w-[7rem] self-center pl-2 text-sm text-muted-foreground">
            {field.scaleMaxLabel}
          </span>
        )}
      </RadioGroup>
    </div>
  )
}

/**
 * Rating: a row of stars, filled up to the one picked. Each star is a real
 * radio input (visually hidden), so keyboard and screen readers get a normal
 * radio group; the star is only what it looks like.
 */
export function StarRating({ field, id, value, onChange }: ChoiceProps<string>) {
  const values = scaleValues(field)
  const current = Number(value) || 0
  const [hover, setHover] = useState(0)
  const shown = hover || current

  return (
    <fieldset className="flex flex-wrap gap-1" onMouseLeave={() => setHover(0)}>
      <legend className="sr-only">{field.label}</legend>
      {values.map((n) => (
        <label
          key={n}
          htmlFor={`${id}-star-${n}`}
          onMouseEnter={() => setHover(n)}
          className="cursor-pointer rounded-md p-1 transition-transform hover:scale-110 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          <input
            id={`${id}-star-${n}`}
            type="radio"
            name={`${id}-stars`}
            value={n}
            checked={current === n}
            onChange={() => onChange(String(n))}
            className="sr-only"
          />
          <span className="sr-only">
            {n} star{n === 1 ? '' : 's'}
          </span>
          <Star
            aria-hidden
            className={cn(
              'h-8 w-8 transition-colors',
              n <= shown ? 'fill-primary text-primary' : 'text-muted-foreground/50',
            )}
          />
        </label>
      ))}
    </fieldset>
  )
}

/**
 * Multiple choice grid and checkbox grid. A table on wide screens; on a phone
 * each row becomes its own small block of choices, because a five-column table
 * is unusable at 390px.
 */
export function ChoiceGrid({ field, id, value, onChange }: ChoiceProps<GridAnswer>) {
  const rows = (field.gridRows ?? []).map((r) => r.row)
  const columns = (field.gridColumns ?? []).map((c) => c.column)
  const multi = field.fieldType === 'checkboxGrid'

  const picked = (row: string): string[] => {
    const v = value[row]
    return Array.isArray(v) ? v : v ? [v] : []
  }
  const toggle = (row: string, column: string, on: boolean) => {
    const next = { ...value }
    if (multi) {
      const now = picked(row)
      next[row] = on ? [...now, column] : now.filter((c) => c !== column)
    } else {
      next[row] = on ? column : ''
    }
    onChange(next)
  }

  const control = (row: string, column: string, rowIndex: number, colIndex: number) => {
    const cellId = `${id}-${rowIndex}-${colIndex}`
    const on = picked(row).includes(column)
    return multi ? (
      <Checkbox
        id={cellId}
        checked={on}
        aria-label={`${row}: ${column}`}
        onCheckedChange={(checked) => toggle(row, column, checked === true)}
      />
    ) : (
      <RadioGroupItem
        id={cellId}
        value={column}
        aria-label={`${row}: ${column}`}
        className="h-5 w-5"
      />
    )
  }

  /**
   * One row's choices as a single radio group. On the table the group *is* the
   * `<tr>` (Radix `asChild`), since a wrapper div inside a table row is not
   * valid markup.
   */
  const radioRow = (row: string, asChild: boolean, children: ReactNode) => (
    <RadioGroupPrimitive.Root
      asChild={asChild}
      value={picked(row)[0] ?? ''}
      onValueChange={(column) => toggle(row, column, true)}
      aria-label={row}
    >
      {children}
    </RadioGroupPrimitive.Root>
  )

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card" />
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2 pb-1 text-center font-normal text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const cells = (
                <tr key={row}>
                  <th
                    scope="row"
                    className="sticky left-0 rounded-l-lg bg-muted/30 px-3 py-3 text-left font-normal"
                  >
                    {row}
                  </th>
                  {columns.map((column, c) => (
                    <td
                      key={column}
                      className={cn(
                        'bg-muted/30 px-2 py-3 text-center',
                        c === columns.length - 1 && 'rounded-r-lg',
                      )}
                    >
                      <div className="flex justify-center">{control(row, column, r, c)}</div>
                    </td>
                  ))}
                </tr>
              )
              return multi ? cells : <Fragment key={row}>{radioRow(row, true, cells)}</Fragment>
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {rows.map((row, r) => (
          <fieldset key={row} className="rounded-lg bg-muted/30 p-3">
            <legend className="float-left mb-2 w-full text-sm font-medium">{row}</legend>
            {(() => {
              const choices = (
                <div className="clear-both flex flex-col gap-1">
                  {columns.map((column, c) => (
                    <Label
                      key={column}
                      htmlFor={`${id}-m-${r}-${c}`}
                      className="flex min-h-10 items-center gap-3 font-normal"
                    >
                      {multi ? (
                        <Checkbox
                          id={`${id}-m-${r}-${c}`}
                          checked={picked(row).includes(column)}
                          onCheckedChange={(checked) => toggle(row, column, checked === true)}
                        />
                      ) : (
                        <RadioGroupItem
                          id={`${id}-m-${r}-${c}`}
                          value={column}
                          className="h-5 w-5"
                        />
                      )}
                      {column}
                    </Label>
                  ))}
                </div>
              )
              return multi ? choices : radioRow(row, false, choices)
            })()}
          </fieldset>
        ))}
      </div>
    </>
  )
}
