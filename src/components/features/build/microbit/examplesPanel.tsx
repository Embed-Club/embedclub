'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MicrobitExample } from '@/lib/microbit/examples'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ExamplesPanelProps {
  examples: MicrobitExample[]
  mode: 'blocks' | 'python'
  /** True when the program on screen has changes that loading would throw away. */
  isEdited: () => boolean
  onLoad: (example: MicrobitExample) => void
}

/**
 * Programs to start from. Picking one replaces what is in the editor - the
 * blocks in Blocks mode, the Python in Python mode - and asks first if the
 * student has changed anything since the last example or a fresh start.
 */
export function ExamplesPanel({ examples, mode, isEdited, onLoad }: ExamplesPanelProps) {
  const [pending, setPending] = useState<MicrobitExample | null>(null)
  const where = mode === 'blocks' ? 'blocks' : 'Python'

  const pick = (example: MicrobitExample) => {
    if (isEdited()) setPending(example)
    else onLoad(example)
  }

  return (
    <section aria-labelledby="microbit-examples" className="flex flex-col gap-4 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="microbit-examples" className="text-lg font-semibold">
          Examples
        </h2>
        <p className="text-sm text-muted-foreground">
          Opens in {where}. Flash it, then change it and see what happens.
        </p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3">
        {examples.map((example) => (
          <li key={example.id}>
            <button
              type="button"
              onClick={() => pick(example)}
              className="group flex h-full w-full items-center gap-4 rounded-2xl border border-border bg-card/60 p-3 text-left transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0"
            >
              <LedPreview pattern={example.preview} />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                  {example.name}
                </span>
                <span className="text-sm leading-snug text-muted-foreground">
                  {example.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Replace your program?</DialogTitle>
            <DialogDescription>
              Loading {pending?.name} swaps out the {where} you have been working on. Your changes
              are not kept anywhere else, so download the .hex first if you want them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPending(null)}>
              Keep my program
            </Button>
            <Button
              onClick={() => {
                if (pending) onLoad(pending)
                setPending(null)
              }}
            >
              Load {pending?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/**
 * The example's picture on a tiny 5x5 LED grid, the way it looks on the board.
 * Brightness digits 1-9 become opacity, so dim pixels read as dim.
 */
function LedPreview({ pattern }: { pattern: string }) {
  const pixels = pattern.replace(/:/g, '').padEnd(25, '0').slice(0, 25).split('')
  return (
    <span
      aria-hidden
      className="grid size-16 shrink-0 grid-cols-5 gap-1 rounded-xl border border-border bg-background p-2 transition-colors group-hover:border-primary/40"
    >
      {pixels.map((digit, index) => {
        const level = Number(digit) / 9
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed 25-cell grid whose cells never reorder
            key={index}
            className={cn(
              'rounded-[2px] transition-shadow duration-300',
              level > 0
                ? 'bg-primary group-hover:shadow-[0_0_6px_hsl(var(--primary)/0.8)]'
                : 'bg-muted',
            )}
            style={level > 0 ? { opacity: 0.35 + level * 0.65 } : undefined}
          />
        )
      })}
    </span>
  )
}
