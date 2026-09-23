'use client'

import type { StudioCategory } from '@/lib/microbit/toolbox'
import { cn } from '@/lib/utils'
import {
  Cable,
  Calculator,
  GitBranch,
  LayoutGrid,
  Lightbulb,
  type LucideIcon,
  MousePointerClick,
  Music,
  Radio,
  Repeat,
  SquareFunction,
  Type,
  Variable,
} from 'lucide-react'
import { Fragment } from 'react'

const ICONS: Record<string, LucideIcon> = {
  basic: LayoutGrid,
  input: MousePointerClick,
  music: Music,
  led: Lightbulb,
  radio: Radio,
  pins: Cable,
  logic: GitBranch,
  loops: Repeat,
  math: Calculator,
  text: Type,
  variables: Variable,
  functions: SquareFunction,
}

interface CategoryRailProps {
  categories: StudioCategory[]
  /** Block colour per category id, read from Blockly once it has a theme. */
  colours: Record<string, string>
  active: string | null
  onPick: (id: string) => void
}

/**
 * The block palette's categories, drawn by us instead of Blockly.
 *
 * Blockly's own toolbox is a list of labels with a coloured stripe down one
 * side, which is exactly the look the rest of the site has left behind. This
 * rail keeps Blockly's flyout (the drawer of blocks) and replaces only the
 * list: a column with a swatch and icon per category on a wide screen, and a
 * row of thumb-sized chips across the top on a phone, where a side column
 * would eat a third of a canvas that is already narrow.
 */
export function CategoryRail({ categories, colours, active, onPick }: CategoryRailProps) {
  return (
    <nav
      aria-label="Block categories"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card/70 p-2 [scrollbar-width:none] md:w-44 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:p-2.5 [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((category, index) => {
        const Icon = ICONS[category.id] ?? LayoutGrid
        const colour = colours[category.id] ?? 'hsl(var(--muted-foreground))'
        const selected = active === category.id
        const startsGroup = index > 0 && categories[index - 1].group !== category.group
        return (
          <Fragment key={category.id}>
            {startsGroup && (
              <span
                aria-hidden
                className="mx-1 w-px shrink-0 self-stretch bg-border md:mx-2 md:my-1.5 md:h-px md:w-auto"
              />
            )}
            <button
              type="button"
              onClick={() => onPick(category.id)}
              aria-pressed={selected}
              className={cn(
                'group flex h-11 shrink-0 items-center gap-2.5 rounded-xl pl-1.5 pr-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:w-full md:pr-2',
                selected
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow] duration-200 md:size-7"
                style={{
                  backgroundColor: selected
                    ? colour
                    : `color-mix(in srgb, ${colour} 18%, transparent)`,
                  color: selected ? 'hsl(var(--background))' : colour,
                  boxShadow: selected
                    ? `0 4px 14px -4px color-mix(in srgb, ${colour} 70%, transparent)`
                    : undefined,
                }}
              >
                <Icon className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="whitespace-nowrap">{category.name}</span>
            </button>
          </Fragment>
        )
      })}
    </nav>
  )
}
