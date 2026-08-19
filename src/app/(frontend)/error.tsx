'use client'

import { useEffect } from 'react'

/**
 * Error boundary for every frontend route.
 *
 * The pages fetch through the Payload local API, so a database outage surfaces
 * as a thrown error rather than an empty result. Without this, Next falls back
 * to its own bare error screen; with it, an outage reads as an outage - and
 * `reset()` re-runs the failed render, which is usually all a transient Neon
 * blip needs.
 *
 * Deliberately not the shell (`SidebarShell`/`MainbarShell`): the boundary has
 * to render even when the failure is in the layout's own data, so it stays
 * self-contained and uses only theme tokens.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack once this is
    // deployed - Next strips the message in production.
    console.error('[Frontend] Route error:', error.digest ?? '', error)
  }, [error])

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="text-2xl font-bold text-foreground">Something went wrong</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page could not be loaded. It is usually a temporary problem - try again in a moment,
          and get in touch if it keeps happening.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Try again
      </button>
    </div>
  )
}
