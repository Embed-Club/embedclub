'use client'

import { Button } from '@/components/ui/button'
import { useMicrobitUsb } from '@/hooks/useMicrobitUsb'
import { STARTER_WORKSPACE } from '@/lib/microbit/blocks'
import { buildHex } from '@/lib/microbit/hexBuilder'
import { cn } from '@/lib/utils'
import { Blocks, Code2, Download, Plug, Trash2, Unplug, Usb, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BlocksWorkspace } from './blocksWorkspace'
import { PythonEditor } from './pythonEditor'
import { SerialConsole } from './serialConsole'

type Mode = 'blocks' | 'python'

interface SavedProject {
  mode: Mode
  workspace: object | null
  python: string
  /** True once the Python has been edited by hand and no longer mirrors the blocks. */
  detached: boolean
}

interface MicrobitStudioProps {
  /** Namespaces the browser-side save, so two boards never share a draft. */
  storageKey: string
}

/**
 * The micro:bit editor: blocks or Python, flash over USB, read the console.
 *
 * Blocks generate Python one way. Switching to the Python tab lets you edit
 * that text; the moment you do, the two detach and going back to blocks asks
 * before throwing your edits away. Everything is saved to localStorage as you
 * go, so a refresh does not lose the program.
 */
export function MicrobitStudio({ storageKey }: MicrobitStudioProps) {
  const key = `build:microbit:${storageKey}`
  const [loaded, setLoaded] = useState<SavedProject | null>(null)

  useEffect(() => {
    setLoaded(readProject(key))
  }, [key])

  if (!loaded) {
    return <div className="h-[70vh] rounded-2xl border border-border bg-card/60" />
  }

  return <Studio storageKey={key} initial={loaded} />
}

function Studio({ storageKey, initial }: { storageKey: string; initial: SavedProject }) {
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [workspace, setWorkspace] = useState<object | null>(initial.workspace)
  const [python, setPython] = useState(initial.python)
  const [detached, setDetached] = useState(initial.detached)
  // The Python the blocks last produced, kept apart from the editable text so
  // we can tell whether the text has been changed by hand.
  const generatedRef = useRef(initial.python)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const usb = useMicrobitUsb()

  useEffect(() => {
    writeProject(storageKey, { mode, workspace, python, detached })
  }, [storageKey, mode, workspace, python, detached])

  const onBlocksChange = useCallback(
    (state: object, generated: string) => {
      setWorkspace(state)
      generatedRef.current = generated
      if (!detached) setPython(generated)
    },
    [detached],
  )

  const onPythonChange = useCallback((text: string) => {
    setPython(text)
    if (text !== generatedRef.current) setDetached(true)
  }, [])

  const switchMode = (next: Mode) => {
    if (next === mode) return
    if (next === 'blocks' && detached) {
      const ok = window.confirm(
        'Your Python edits will be replaced by the code the blocks generate. Continue?',
      )
      if (!ok) return
      setDetached(false)
      setPython(generatedRef.current)
    }
    setMode(next)
  }

  const resetProject = () => {
    if (!window.confirm('Start over with a fresh program? This cannot be undone.')) return
    window.localStorage.removeItem(storageKey)
    window.location.reload()
  }

  const download = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const hex = await buildHex(python)
      const blob = new Blob([hex.universal()], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'microbit-program.hex'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not build the hex.')
    } finally {
      setDownloading(false)
    }
  }

  const busy = usb.flash.phase === 'building' || usb.flash.phase === 'flashing'
  const connected = usb.status === 'Connected'

  const statusLine = useMemo(() => {
    if (usb.supported === false) {
      return 'This browser cannot flash over USB. Use Chrome or Edge, or download the hex and drop it on the MICROBIT drive.'
    }
    switch (usb.flash.phase) {
      case 'building':
        return 'Building hex...'
      case 'flashing':
        return usb.flash.stage === 'PartialFlashing' || usb.flash.stage === 'FullFlashing'
          ? `Flashing ${Math.round(usb.flash.progress * 100)}%`
          : 'Connecting to the micro:bit...'
      case 'done':
        return 'Flashed. The program is running on the micro:bit.'
      case 'error':
        return usb.flash.message
      default:
        return connected
          ? `Connected to micro:bit ${usb.boardVersion ?? ''}`
          : 'Plug in a micro:bit and press Flash.'
    }
  }, [usb.supported, usb.flash, usb.boardVersion, connected])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          <ModeButton active={mode === 'blocks'} onClick={() => switchMode('blocks')}>
            <Blocks /> Blocks
          </ModeButton>
          <ModeButton active={mode === 'python'} onClick={() => switchMode('python')}>
            <Code2 /> Python
          </ModeButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetProject} title="Start over">
            <Trash2 /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={download} disabled={downloading}>
            <Download /> {downloading ? 'Building...' : 'Download .hex'}
          </Button>
          {usb.supported && (
            <>
              {connected ? (
                <Button variant="outline" size="sm" onClick={usb.disconnect} disabled={busy}>
                  <Unplug /> Disconnect
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={usb.connect} disabled={busy}>
                  <Plug /> Connect
                </Button>
              )}
              <Button size="sm" onClick={() => usb.flashScript(python)} disabled={busy}>
                <Zap /> {busy ? 'Flashing...' : 'Flash'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <p
        className={cn(
          'flex items-center gap-2 text-sm',
          usb.flash.phase === 'error' || downloadError
            ? 'text-destructive'
            : 'text-muted-foreground',
        )}
      >
        <Usb className="h-4 w-4 shrink-0" />
        {downloadError ?? statusLine}
      </p>

      {/* Editor */}
      <div className="relative h-[65vh] min-h-[480px] w-full overflow-hidden rounded-2xl border border-border bg-background">
        {mode === 'blocks' ? (
          <BlocksWorkspace
            initialState={workspace ?? STARTER_WORKSPACE}
            onChange={onBlocksChange}
          />
        ) : (
          <PythonEditor value={python} onChange={onPythonChange} />
        )}
      </div>

      {/* Console */}
      {usb.supported && <SerialConsole lines={usb.serial} onClear={usb.clearSerial} />}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function readProject(key: string): SavedProject {
  const fallback: SavedProject = {
    mode: 'blocks',
    workspace: null,
    python: '',
    detached: false,
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SavedProject>
    return {
      mode: parsed.mode === 'python' ? 'python' : 'blocks',
      workspace: parsed.workspace ?? null,
      python: typeof parsed.python === 'string' ? parsed.python : '',
      detached: Boolean(parsed.detached),
    }
  } catch {
    return fallback
  }
}

function writeProject(key: string, project: SavedProject) {
  try {
    window.localStorage.setItem(key, JSON.stringify(project))
  } catch {
    // Private mode or full storage - the program still works, just not saved.
  }
}
