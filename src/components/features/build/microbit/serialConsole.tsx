'use client'

import { Button } from '@/components/ui/button'
import type { SerialLine } from '@/hooks/useMicrobitUsb'
import { Eraser } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface SerialConsoleProps {
  lines: SerialLine[]
  onClear: () => void
}

/**
 * What the micro:bit prints, live. `print()` in the program lands here over
 * the same USB connection the flasher uses, as do MicroPython's own error
 * messages - which is how a student finds out their program crashed.
 */
export function SerialConsole({ lines, onClear }: SerialConsoleProps) {
  const endRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every new line, which is what `lines` changing means
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  return (
    <section className="rounded-2xl border border-border bg-card/60 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Console
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={lines.length === 0}>
          <Eraser /> Clear
        </Button>
      </div>
      <div className="h-40 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-muted-foreground">
            Nothing yet. Use the &quot;print to console&quot; block, or <code>print()</code> in
            Python, and it shows up here after you flash.
          </p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="whitespace-pre-wrap break-all">
              {line.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </section>
  )
}
