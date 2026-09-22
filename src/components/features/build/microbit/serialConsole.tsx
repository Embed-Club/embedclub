'use client'

import { Button } from '@/components/ui/button'
import type { SerialLine } from '@/hooks/useMicrobitUsb'
import { cn } from '@/lib/utils'
import { ChevronLeft, Eraser } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SerialConsoleProps {
  lines: SerialLine[]
  onClear: () => void
}

/**
 * What the micro:bit prints, live. `print()` in the program lands here over
 * the same USB connection the flasher uses, as do MicroPython's own error
 * messages - which is how a student finds out their program crashed.
 *
 * Collapsed until there is something to read. It used to hold a fixed strip of
 * empty space under the editor explaining itself, which on a phone cost a
 * chunk of the one screen the canvas had to share.
 */
export function SerialConsole({ lines, onClear }: SerialConsoleProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const hasOutput = lines.length > 0

  // Open itself the first time the board says something - the output is the
  // reason to look, so waiting for a click would hide the answer.
  useEffect(() => {
    if (hasOutput) setOpen(true)
  }, [hasOutput])

  // The log scrolls itself rather than calling scrollIntoView on a marker:
  // scrollIntoView moves whatever ancestor it has to, which on mount dragged
  // the whole page down past the editor to reach an empty console.
  useEffect(() => {
    if (lines.length === 0) return
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [lines])

  return (
    <section className="shrink-0 overflow-hidden rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between gap-2 pl-1 pr-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex h-11 flex-1 items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10"
        >
          <ChevronLeft
            aria-hidden
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && '-rotate-90',
            )}
          />
          Console
          <span className="text-xs font-normal text-muted-foreground">
            {hasOutput ? `${lines.length} line${lines.length === 1 ? '' : 's'}` : 'no output yet'}
          </span>
        </button>

        {hasOutput && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Eraser aria-hidden /> Clear
          </Button>
        )}
      </div>

      {open && (
        <div
          ref={logRef}
          className="max-h-40 overflow-y-auto border-t border-border px-4 py-3 font-mono text-sm leading-relaxed"
        >
          {hasOutput ? (
            lines.map((line) => (
              <div key={line.id} className="whitespace-pre-wrap break-all">
                {line.text}
              </div>
            ))
          ) : (
            <p className="font-sans text-muted-foreground">
              Add a &quot;print to console&quot; block, or <code>print()</code> in Python, and
              whatever the board prints shows up here once you flash.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
