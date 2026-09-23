'use client'

import { defineMicrobitBlocks } from '@/lib/microbit/blocks'
import { workspaceToMicroPython } from '@/lib/microbit/generator'
import { CATEGORIES, TOOLBOX } from '@/lib/microbit/toolbox'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import * as En from 'blockly/msg/en'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type CanvasAction, CanvasActions } from './canvasActions'
import { CategoryRail } from './categoryRail'

Blockly.setLocale(En as unknown as Record<string, string>)

interface BlocksWorkspaceProps {
  /** Serialised workspace to load on mount, or null for a blank canvas. */
  initialState: object | null
  /** Fired on every change with the serialised workspace and the Python it makes. */
  onChange: (state: object, python: string) => void
}

/**
 * The Blockly canvas, with our own category rail beside it and an action bar
 * over it. Mounted once per program; Blockly keeps its own DOM inside the host
 * div and this component only ferries changes out. Loading a different program
 * means remounting it with a new `key`.
 */
export function BlocksWorkspace({ initialState, onChange }: BlocksWorkspaceProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [colours, setColours] = useState<Record<string, string>>({})
  const [hasSelection, setHasSelection] = useState(false)
  const [history, setHistory] = useState({ undo: false, redo: false })

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialState is read once on mount by design - later edits flow out through onChange, not back in
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    defineMicrobitBlocks()

    // Blockly sizes its scrollbars at 25px once it detects touch, and 15px
    // otherwise - both heavy enough to eat the canvas on a phone. Set before
    // injecting, since the workspace reads it while building its scrollbars.
    Blockly.Scrollbar.scrollbarThickness = 8

    const touch = window.matchMedia('(pointer: coarse)').matches
    const workspace = Blockly.inject(host, {
      toolbox: TOOLBOX,
      theme: theme(),
      renderer: 'zelos',
      grid: { spacing: 24, length: 3, colour: 'hsl(var(--border))', snap: true },
      // Blocks start larger on a touch screen: a 0.9 scale block is a fiddly
      // drag target with a fingertip, and pinch-zoom is there to go smaller.
      // The zoom buttons are ours (CanvasActions), so Blockly's are off.
      zoom: {
        controls: false,
        wheel: true,
        startScale: touch ? 1.05 : 0.9,
        maxScale: 2.5,
        minScale: 0.4,
      },
      move: { scrollbars: true, drag: true, wheel: false },
      trashcan: true,
    })
    workspaceRef.current = workspace

    // The category list is drawn by CategoryRail; Blockly's copy stays in the
    // DOM only so it can keep driving the flyout.
    const toolbox = workspace.getToolbox()
    if (toolbox instanceof Blockly.Toolbox) toolbox.setVisible(false)

    const themed = workspace.getTheme()
    setColours(
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category.id,
          category.hue === undefined
            ? (themed.categoryStyles[category.style ?? '']?.colour ?? '')
            : Blockly.utils.colour.hueToHex(category.hue),
        ]),
      ),
    )

    if (initialState) {
      try {
        Blockly.serialization.workspaces.load(initialState, workspace)
      } catch {
        // A stale or hand-edited save - start blank rather than crash.
      }
    }
    // Loading is not something to undo back past.
    workspace.clearUndo()
    showFromTopLeft(workspace)

    // A loose block outside any `on start`, `forever` or event would never
    // run, so grey it out the way MakeCode does instead of dropping it silently.
    workspace.addChangeListener(Blockly.Events.disableOrphans)

    // Blockly hides the flyout but leaves the flyout's scrollbar drawn. The
    // scrollbar is an <svg> sibling of the flyout inside injectionDiv rather
    // than a child of it, so `display: none` on the flyout never reaches it,
    // and opening then closing a category leaves a stray vertical line down
    // the canvas. Mirror the flyout's own display onto it.
    const mirrorFlyoutScrollbar = () => {
      const flyoutEl = host.querySelector<SVGElement>('.blocklyFlyout')
      const scrollbarEl = host.querySelector<SVGElement>('.blocklyFlyoutScrollbar')
      if (!scrollbarEl) return
      const flyoutHidden = !flyoutEl || window.getComputedStyle(flyoutEl).display === 'none'
      // Cleared rather than set to 'block' when open, so Blockly keeps control
      // of its own scrollbar while the flyout is actually showing.
      scrollbarEl.style.display = flyoutHidden ? 'none' : ''
    }

    const flyoutObserver = new MutationObserver(mirrorFlyoutScrollbar)
    flyoutObserver.observe(host, {
      attributes: true,
      subtree: true,
      childList: true,
      attributeFilter: ['style', 'class'],
    })
    mirrorFlyoutScrollbar()

    const emit = () => {
      const state = Blockly.serialization.workspaces.save(workspace)
      onChangeRef.current(state, workspaceToMicroPython(workspace))
    }

    const syncSelection = () => {
      const selected = Blockly.common.getSelected()
      setHasSelection(
        selected instanceof Blockly.BlockSvg && !selected.isShadow() && selected.isDeletable(),
      )
    }

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        const current = toolbox instanceof Blockly.Toolbox ? toolbox.getSelectedItem() : null
        setActiveCategory(current?.getId() ?? null)
      }
      if (event.type === Blockly.Events.SELECTED || event.type === Blockly.Events.BLOCK_DELETE) {
        syncSelection()
      }
      // A drag fires dozens of events; only re-render when a button flips.
      const undo = workspace.getUndoStack().length > 0
      const redo = workspace.getRedoStack().length > 0
      setHistory((prev) => (prev.undo === undo && prev.redo === redo ? prev : { undo, redo }))
      // UI-only events (selection, scroll, toolbox open) don't change the program.
      if (event.isUiEvent) return
      emit()
    }
    workspace.addChangeListener(listener)
    emit()

    const observer = new ResizeObserver(() => Blockly.svgResize(workspace))
    observer.observe(host)
    // One resize after the first paint, for the case where the host was still
    // being laid out when Blockly measured it.
    const raf = requestAnimationFrame(() => {
      Blockly.svgResize(workspace)
      showFromTopLeft(workspace)
    })

    return () => {
      cancelAnimationFrame(raf)
      flyoutObserver.disconnect()
      observer.disconnect()
      workspace.removeChangeListener(listener)
      workspace.dispose()
      workspaceRef.current = null
    }
  }, [])

  const pickCategory = useCallback((id: string) => {
    const toolbox = workspaceRef.current?.getToolbox()
    if (!(toolbox instanceof Blockly.Toolbox)) return
    // A second tap on the open category closes its drawer, as it does in MakeCode.
    // The rail updates straight away; Blockly's select event lands a frame
    // later and also covers the drawer closing by itself (a block dragged
    // out, a tap on the canvas).
    if (toolbox.getSelectedItem()?.getId() === id) {
      toolbox.clearSelection()
      setActiveCategory(null)
      return
    }
    toolbox.setSelectedItem(toolbox.getToolboxItemById(id))
    setActiveCategory(id)
  }, [])

  const runAction = useCallback((action: CanvasAction) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const selected = Blockly.common.getSelected()
    const block = selected instanceof Blockly.BlockSvg ? selected : null

    switch (action) {
      case 'undo':
      case 'redo':
        workspace.undo(action === 'redo')
        break
      case 'duplicate': {
        const data = block?.toCopyData()
        if (data) Blockly.clipboard.paste(data, workspace)
        break
      }
      case 'delete':
        if (block?.isDeletable()) block.checkAndDelete()
        break
      case 'tidy':
        workspace.cleanUp()
        break
      case 'zoomIn':
      case 'zoomOut':
        workspace.zoomCenter(action === 'zoomIn' ? 1 : -1)
        break
      case 'fit':
        workspace.zoomToFit()
        break
    }
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row">
      <CategoryRail
        categories={CATEGORIES}
        colours={colours}
        active={activeCategory}
        onPick={pickCategory}
      />
      <div className="relative min-h-0 min-w-0 flex-1">
        {/* Absolute rather than h-full: Blockly measures its host at inject
            time, and a flex child that has not been laid out yet measures
            zero, which left the workspace as a 150px stub. */}
        <div ref={hostRef} className="absolute inset-0" />
        <CanvasActions
          canUndo={history.undo}
          canRedo={history.redo}
          hasSelection={hasSelection}
          onAction={runAction}
        />
      </div>
    </div>
  )
}

/**
 * Scroll so the program's top-left corner sits just inside the canvas. Left to
 * itself Blockly pins the content flush against the edge, which with the
 * toolbox hidden put every block touching the category rail.
 */
function showFromTopLeft(workspace: Blockly.WorkspaceSvg) {
  if (!workspace.getTopBlocks(false).length) return
  const box = workspace.getBlocksBoundingBox()
  const margin = 24
  // On a phone the edit bar spans most of the canvas width, so start the
  // program below it rather than behind it.
  const top = window.matchMedia('(max-width: 639px)').matches ? 76 : margin
  workspace.scroll(margin - box.left * workspace.scale, top - box.top * workspace.scale)
}

/**
 * Blockly's chrome painted with the site tokens. Block colours stay Blockly's
 * own hues (see blocks.ts) - only the canvas, toolbox and flyout follow the
 * theme, and they follow it in both modes because they read CSS variables.
 */
function theme(): Blockly.Theme {
  return Blockly.Theme.defineTheme('embedClub', {
    name: 'embedClub',
    base: Blockly.Themes.Zelos,
    // A rounded cap on every block that starts a script (on start, forever,
    // events), so the starting points read as different from the rest.
    startHats: true,
    componentStyles: {
      workspaceBackgroundColour: 'hsl(var(--background))',
      toolboxBackgroundColour: 'hsl(var(--card))',
      toolboxForegroundColour: 'hsl(var(--foreground))',
      flyoutBackgroundColour: 'hsl(var(--card))',
      flyoutForegroundColour: 'hsl(var(--foreground))',
      flyoutOpacity: 0.97,
      scrollbarColour: 'hsl(var(--muted-foreground))',
      scrollbarOpacity: 0.4,
      insertionMarkerColour: 'hsl(var(--primary))',
      insertionMarkerOpacity: 0.4,
      markerColour: 'hsl(var(--primary))',
      cursorColour: 'hsl(var(--primary))',
      selectedGlowColour: 'hsl(var(--primary))',
      selectedGlowOpacity: 0.5,
    },
    fontStyle: {
      family: 'inherit',
      weight: '500',
      size: 11,
    },
  })
}
