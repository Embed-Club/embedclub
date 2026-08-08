'use client'

import { useTheme } from '@payloadcms/ui'

/**
 * Replaces Payload's own wordmark on the admin login screen and nav.
 *
 * The banner artwork is drawn for a specific background, so pick the variant
 * from the admin's own theme rather than a CSS media query — the admin has its
 * own light/dark toggle that does not have to match the OS.
 */
export default function AdminLogo() {
  const { theme } = useTheme()

  return (
    <img
      src={theme === 'light' ? '/EmbedClubBanner-Light.svg' : '/EmbedClubBanner-Dark.svg'}
      alt="Embed Club"
      style={{ width: '100%', maxWidth: 320, height: 'auto' }}
    />
  )
}
