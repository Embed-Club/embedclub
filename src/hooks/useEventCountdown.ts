'use client'

import { useEffect, useState } from 'react'

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * One clock for the whole page. The hero and the pass both read from here so
 * they can never drift apart, and the interval is cleared on unmount.
 */
export function useEventCountdown(eventStart = '2026-11-25T08:30:00+05:30') {
  const [left, setLeft] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(eventStart).getTime() - Date.now())
      setLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [eventStart])

  return left
}
