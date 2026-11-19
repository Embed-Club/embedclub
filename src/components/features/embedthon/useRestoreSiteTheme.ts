'use client'

import { useTheme } from 'next-themes'
import { useLayoutEffect } from 'react'

const STORAGE_KEY = 'theme'

/**
 * The event pages flip the document between dark and light as you scroll, and
 * next-themes saves every flip as the visitor's own choice. Left alone, someone
 * who opens /embers and then goes back to the club site finds it stuck on
 * whichever theme the scroll ended on.
 *
 * This remembers the stored preference before anything on the page touches it
 * (a layout effect runs ahead of every child's effect, including the hero's
 * `setTheme('dark')`) and puts it back when the page unmounts or the tab is
 * closed or reloaded, so only the page itself ever sees the flips.
 */
export function useRestoreSiteTheme() {
  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      // Storage blocked: nothing was persisted either, so nothing to restore.
    }

    const restoreStorage = () => {
      try {
        if (saved === null) window.localStorage.removeItem(STORAGE_KEY)
        else window.localStorage.setItem(STORAGE_KEY, saved)
      } catch {
        // Same as above.
      }
    }

    window.addEventListener('pagehide', restoreStorage)
    return () => {
      window.removeEventListener('pagehide', restoreStorage)
      restoreStorage()
      setTheme(saved ?? 'system')
    }
  }, [setTheme])
}
