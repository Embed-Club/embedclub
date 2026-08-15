'use client'

/**
 * The hero title, set as plain text.
 *
 * It used to scramble in through `DecryptedText` on view, but the landing
 * intro's logo fill and glide covers the whole viewport while that plays — the
 * effect had always finished by the time anything was visible. `comingSoon`
 * still uses that component, where it does get seen.
 */
export default function DashboardTitle() {
  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <div className="text-2xl md:text-3xl lg:text-4xl font-light mb-4">ELCOE TO</div>
      <div className="text-5xl md:text-6xl lg:text-7xl font-bold">EBED CLUB</div>
    </div>
  )
}
