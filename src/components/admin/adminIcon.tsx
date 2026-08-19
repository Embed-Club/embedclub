'use client'

import { useTheme } from '@payloadcms/ui'

/**
 * The compact mark, used where the admin has no room for the full lockup
 * (collapsed nav, browser-adjacent chrome). Theme-picked for the same reason
 * as [AdminLogo] - the admin's theme is independent of the OS one.
 */
export default function AdminIcon() {
  const { theme } = useTheme()

  return (
    <img
      src={theme === 'light' ? '/embedClubLogo-Light.svg' : '/embedClubLogo-Dark.svg'}
      alt="Embed Club"
      style={{ width: '100%', maxWidth: 40, height: 'auto' }}
    />
  )
}
