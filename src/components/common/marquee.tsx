import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string
  /** Reverse the scroll direction. */
  reverse?: boolean
  /** Pause this row's animation while the pointer is over it. */
  pauseOnHover?: boolean
  children: React.ReactNode
  /** Scroll vertically instead of horizontally. */
  vertical?: boolean
  /** How many times to repeat the children so the track never shows a gap. */
  repeat?: number
}

/**
 * magicui Marquee - infinite CSS-driven scrolling track. Each Marquee is its
 * own `group`, so `pauseOnHover` pauses only the row you're hovering; sibling
 * rows keep moving. Drive speed with `[--duration:40s]` and gap with `[--gap]`.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length repeat of the same track
          key={i}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row': !vertical,
            'animate-marquee-vertical flex-col': vertical,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
            '[animation-direction:reverse]': reverse,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
