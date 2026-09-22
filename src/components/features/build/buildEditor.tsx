'use client'

import type { BuildTarget } from '@/payload/payload-types'
import dynamic from 'next/dynamic'

// Blockly and CodeMirror are browser-only and about a megabyte together -
// loaded on demand, never server-rendered.
const MicrobitStudio = dynamic(
  () => import('./microbit/microbitStudio').then((m) => m.MicrobitStudio),
  {
    ssr: false,
    loading: () => (
      <div className="h-[58svh] min-h-[320px] rounded-2xl border border-border bg-card/50" />
    ),
  },
)

/**
 * Picks the in-browser editor for a build target. One entry per `editor`
 * option on the collection - TypeScript's exhaustive switch fails the build
 * if an option is added there without a component here.
 */
export function BuildEditor({ target }: { target: BuildTarget }) {
  switch (target.editor) {
    case 'microbitPython':
      return <MicrobitStudio storageKey={target.slug} />
    default: {
      const unhandled: never = target.editor
      throw new Error(`No editor component for ${String(unhandled)}`)
    }
  }
}
