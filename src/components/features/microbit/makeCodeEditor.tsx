'use client'

import { ExternalLink, Usb } from 'lucide-react'
import { useEffect, useState } from 'react'

const MAKECODE_HOME = 'https://makecode.microbit.org/'
// MakeCode drops into a read-only "sandbox" viewer whenever it finds itself in
// an iframe; `editorlayout=ide` is pxt's switch for the full editor instead.
const MAKECODE_EMBED = `${MAKECODE_HOME}?editorlayout=ide`

/**
 * The micro:bit MakeCode editor, embedded. Blocks compile to a .hex in the
 * browser; `allow="usb"` hands WebUSB through to the frame so the Download
 * button flashes a plugged-in micro:bit directly instead of only saving a file.
 *
 * WebUSB is Chromium-only, so the hint under the frame changes with the
 * browser: one-click flash where it works, drag-the-hex everywhere else.
 */
export function MakeCodeEditor() {
  // Decided after mount: `navigator` does not exist during SSR, and the two
  // hints must not flip after hydration.
  const [webUsb, setWebUsb] = useState<boolean | null>(null)

  useEffect(() => {
    setWebUsb('usb' in navigator)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Usb className="h-4 w-4 shrink-0" />
          {webUsb === null
            ? 'Checking browser support...'
            : webUsb
              ? 'Plug in a micro:bit, then press Download in the editor to flash it over USB.'
              : 'One-click flashing needs Chrome or Edge. Here, Download saves a .hex - drop it on the MICROBIT drive.'}
        </p>
        <a
          href={MAKECODE_HOME}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Open in MakeCode
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-2xl border border-border bg-black lg:h-[80vh]">
        <iframe
          src={MAKECODE_EMBED}
          title="MakeCode editor for micro:bit"
          allow="usb; serial; bluetooth; clipboard-write; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  )
}
