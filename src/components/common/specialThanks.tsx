'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

/**
 * Alumni who contributed to or sponsored the club's events. Hardcoded for now; it
 * moves into Payload with the announcement it appears on.
 */
export const SPECIAL_THANKS = [
  { name: 'Hashir Abdullah', note: 'Vice President, 2016 to 2020' },
  { name: 'Muadh Bin Mohammed', note: 'President, 2020 to 2024' },
  { name: 'Mohammed Nouman', note: 'Member, 2020 to 2024' },
] as const

/**
 * "Special thanks to our alumni" with a drop box underneath. Hover (mouse) or focus
 * (keyboard) opens it and the names slide in one after another; a tap opens and
 * closes it, since a finger has no hover. It opens in flow rather than floating, so
 * it can sit at the bottom of a modal without being clipped or running off screen.
 */
export function SpecialThanksDropdown({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div
      className={cn('w-full', className)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        className="group flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>
          Special thanks to our <span className="font-semibold text-primary">alumni</span> for
          contributing and sponsoring
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-primary transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id={panelId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <ul className="mt-1 space-y-1 rounded-xl border border-border bg-muted/50 p-3">
            {SPECIAL_THANKS.map((person, index) => (
              <li
                key={person.name}
                className={cn(
                  'flex flex-wrap items-baseline justify-between gap-x-3 transition-[opacity,transform] duration-500 motion-reduce:transition-none',
                  open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
                )}
                style={{ transitionDelay: open ? `${120 + index * 90}ms` : '0ms' }}
              >
                <span className="text-sm font-semibold text-foreground">{person.name}</span>
                <span className="text-xs text-muted-foreground">{person.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
