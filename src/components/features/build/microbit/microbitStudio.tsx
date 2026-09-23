'use client'

import { Button } from '@/components/ui/button'
import { useMicrobitUsb } from '@/hooks/useMicrobitUsb'
import { EXAMPLES, type MicrobitExample, STARTER_EXAMPLE } from '@/lib/microbit/examples'
import { buildHex } from '@/lib/microbit/hexBuilder'
import { cn } from '@/lib/utils'
import { Blocks, Code2, Download, Plug, RotateCcw, Unplug, Usb, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BlocksWorkspace } from './blocksWorkspace'
import { ExamplesPanel } from './examplesPanel'
import { PythonEditor } from './pythonEditor'
import { SerialConsole } from './serialConsole'

/**
 * Controls are finger-sized on a phone and settle to the compact desktop size
 * from `sm` up. PRODUCT.md puts the floor at 44px, and shadcn's `sm` is 32.
 */
const TOUCH_BUTTON = 'h-11 px-4 sm:h-8 sm:px-3'
const TOUCH_ICON_BUTTON = 'h-11 w-11 px-0 sm:h-8 sm:w-auto sm:px-3'

type Mode = 'blocks' | 'python'

interface SavedProject {
  mode: Mode
  workspace: object | null
  python: string
  /** True once the Python has been edited by hand and no longer mirrors the blocks. */
  detached: boolean
  /**
   * The Python of whatever the program started as - a fresh project or the
   * last example loaded. Anything different means the student has changed
   * it, and loading an example over it should ask first.
   */
  baseline: string
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
 *
 * The layout is a column that fills whatever height the page gives it. The
 * editor is the part that stretches; the toolbar and the console stay their
 * own size, so a phone still gets a usable canvas instead of a letterbox.
 */
export function MicrobitStudio({ storageKey }: MicrobitStudioProps) {
  const key = `build:microbit:${storageKey}`
  const [loaded, setLoaded] = useState<SavedProject | null>(null)

  useEffect(() => {
    setLoaded(readProject(key))
  }, [key])

  if (!loaded) {
    return <div className="h-[70svh] min-h-[420px] rounded-2xl border border-border bg-card/50" />
  }

  return <Studio storageKey={key} initial={loaded} />
}

function Studio({ storageKey, initial }: { storageKey: string; initial: SavedProject }) {
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [workspace, setWorkspace] = useState<object | null>(initial.workspace)
  const [python, setPython] = useState(initial.python)
  const [detached, setDetached] = useState(initial.detached)
  const [baseline, setBaseline] = useState(initial.baseline)
  // Bumped to remount the canvas with a different program.
  const [canvasKey, setCanvasKey] = useState(0)
  // Set when fresh blocks are loaded; their first output becomes the baseline.
  const takeBaselineRef = useRef(initial.workspace === null)
  // The Python the blocks last produced, kept apart from the editable text so
  // we can tell whether the text has been changed by hand.
  const generatedRef = useRef(initial.python)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const touch = useIsTouch()

  const usb = useMicrobitUsb()

  useEffect(() => {
    writeProject(storageKey, { mode, workspace, python, detached, baseline })
  }, [storageKey, mode, workspace, python, detached, baseline])

  const onBlocksChange = useCallback(
    (state: object, generated: string) => {
      setWorkspace(state)
      generatedRef.current = generated
      if (takeBaselineRef.current) {
        takeBaselineRef.current = false
        setBaseline(generated)
      }
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

  const isEdited = () =>
    (mode === 'blocks' ? generatedRef.current : python).trim() !== baseline.trim()

  const loadExample = (example: MicrobitExample) => {
    if (mode === 'blocks') {
      takeBaselineRef.current = true
      setWorkspace(example.blocks)
      setDetached(false)
      setCanvasKey((key) => key + 1)
    } else {
      // Hand-written Python has no blocks behind it, so it starts detached.
      setPython(example.python)
      setDetached(true)
      setBaseline(example.python)
    }
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
  // Only the writing stages report a meaningful fraction; the connect stages
  // sit at 0 and would otherwise show a stuck "0%".
  const progress =
    usb.flash.phase === 'flashing' &&
    (usb.flash.stage === 'PartialFlashing' || usb.flash.stage === 'FullFlashing')
      ? usb.flash.progress
      : null

  const status = useMemo(() => {
    if (usb.supported === false) {
      return {
        tone: 'muted' as const,
        text: touch
          ? 'This browser cannot flash over USB. Chrome on Android can, with an OTG adapter. On iPhone, download the hex and copy it to the MICROBIT drive from a computer.'
          : 'This browser cannot flash over USB. Use Chrome or Edge, or download the hex and drop it on the MICROBIT drive.',
      }
    }
    switch (usb.flash.phase) {
      case 'building':
        return { tone: 'muted' as const, text: 'Building the hex...' }
      case 'flashing':
        return {
          tone: 'muted' as const,
          text: progress === null ? 'Connecting to the micro:bit...' : 'Writing to the board...',
        }
      case 'done':
        return { tone: 'good' as const, text: 'Flashed. The program is running on the micro:bit.' }
      case 'error':
        return { tone: 'bad' as const, text: usb.flash.message }
      default:
        return {
          tone: 'muted' as const,
          text: connected
            ? `Connected to micro:bit ${usb.boardVersion ?? ''}`.trim()
            : touch
              ? 'Connect a micro:bit with an OTG adapter, then press Flash.'
              : 'Plug in a micro:bit and press Flash.',
        }
    }
  }, [usb.supported, usb.flash, usb.boardVersion, connected, progress, touch])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset className="inline-flex min-w-0 rounded-lg border border-border bg-card p-1">
          <legend className="sr-only">Editor mode</legend>
          <ModeButton active={mode === 'blocks'} onClick={() => switchMode('blocks')}>
            <Blocks aria-hidden /> Blocks
          </ModeButton>
          <ModeButton active={mode === 'python'} onClick={() => switchMode('python')}>
            <Code2 aria-hidden /> Python
          </ModeButton>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProject}
            className={TOUCH_ICON_BUTTON}
            title="Start over with a fresh program"
          >
            <RotateCcw aria-hidden />
            <span className="sr-only sm:not-sr-only">Reset</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={download}
            disabled={downloading}
            className={TOUCH_BUTTON}
          >
            <Download aria-hidden />
            {downloading ? 'Building...' : 'Download .hex'}
          </Button>
          {usb.supported && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={connected ? usb.disconnect : usb.connect}
                disabled={busy}
                className={TOUCH_ICON_BUTTON}
              >
                {connected ? <Unplug aria-hidden /> : <Plug aria-hidden />}
                <span className="sr-only sm:not-sr-only">
                  {connected ? 'Disconnect' : 'Connect'}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={() => usb.flashScript(python)}
                disabled={busy}
                className={TOUCH_BUTTON}
              >
                <Zap aria-hidden />
                {busy ? 'Flashing' : 'Flash'}
                {progress !== null && ` ${Math.round(progress * 100)}%`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* <output> carries role="status" natively, so a flash result or an
          error is announced without a redundant ARIA role. */}
      <output
        className={cn(
          'flex items-start gap-2 text-sm',
          status.tone === 'bad' && 'text-destructive',
          status.tone === 'good' && 'text-primary',
          status.tone === 'muted' && 'text-muted-foreground',
        )}
      >
        <Usb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span className="max-w-[70ch]">{downloadError ?? status.text}</span>
      </output>

      {/* The editor is the part that stretches. min-h-0 lets it shrink inside
          the column; the min-height keeps it usable on a short phone. */}
      {/* A viewport height, not a flex share. The shell's scroll container
          passes `min-height` down rather than a height, so a percentage here
          resolves against an auto-height parent and collapses - which is what
          left the canvas 2px tall on a phone. svh is definite everywhere, and
          unlike vh it accounts for mobile browser chrome. */}
      {/* `isolate` matters: Blockly's toolbox is absolutely positioned at
          z-index 70 and none of its own ancestors create a stacking context,
          so it competed with the rest of the page and painted over the mobile
          nav panel. A stacking context here keeps that 70 inside the editor
          instead of raising every overlay on the site to outrank it. */}
      <div className="relative isolate h-[70svh] min-h-[420px] overflow-hidden rounded-2xl border border-border bg-background">
        {mode === 'blocks' ? (
          <BlocksWorkspace
            key={canvasKey}
            initialState={workspace ?? STARTER_EXAMPLE.blocks}
            onChange={onBlocksChange}
          />
        ) : (
          <PythonEditor value={python} onChange={onPythonChange} />
        )}
      </div>

      {usb.supported && <SerialConsole lines={usb.serial} onClear={usb.clearSerial} />}

      <ExamplesPanel examples={EXAMPLES} mode={mode} isEdited={isEdited} onLoad={loadExample} />
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
      aria-pressed={active}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8 sm:px-3 [&_svg]:size-4',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Coarse pointer means a phone or tablet, which changes what the advice says. */
function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])
  return touch
}

function readProject(key: string): SavedProject {
  const fallback: SavedProject = {
    mode: 'blocks',
    workspace: null,
    python: '',
    detached: false,
    baseline: '',
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
      baseline: typeof parsed.baseline === 'string' ? parsed.baseline : '',
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
