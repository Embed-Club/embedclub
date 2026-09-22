'use client'

import {
  SCRIPT_HEADER,
  TOOLBOX,
  defineMicrobitBlocks,
  installMicrobitGenerators,
} from '@/lib/microbit/blocks'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import * as En from 'blockly/msg/en'
import { pythonGenerator } from 'blockly/python'
import { useEffect, useRef } from 'react'

Blockly.setLocale(En as unknown as Record<string, string>)

interface BlocksWorkspaceProps {
  /** Serialised workspace to load on mount, or null for a blank canvas. */
  initialState: object | null
  /** Fired on every change with the serialised workspace and the Python it makes. */
  onChange: (state: object, python: string) => void
}

/**
 * The Blockly canvas. Mounted once; Blockly keeps its own DOM inside the div
 * and this component only ferries changes out. Resizing is handled by
 * Blockly's own listener on the container.
 */
export function BlocksWorkspace({ initialState, onChange }: BlocksWorkspaceProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialState is read once on mount by design - later edits flow out through onChange, not back in
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    defineMicrobitBlocks()
    installMicrobitGenerators(pythonGenerator)

    const workspace = Blockly.inject(host, {
      toolbox: TOOLBOX,
      theme: theme(),
      renderer: 'zelos',
      grid: { spacing: 24, length: 3, colour: 'hsl(var(--border))', snap: true },
      // Blocks start larger on a touch screen: a 0.9 scale block is a fiddly
      // drag target with a fingertip, and pinch-zoom is there to go smaller.
      zoom: {
        controls: true,
        wheel: true,
        startScale: window.matchMedia('(pointer: coarse)').matches ? 1.15 : 0.9,
        maxScale: 2.5,
        minScale: 0.4,
      },
      move: { scrollbars: true, drag: true, wheel: false },
      trashcan: true,
    })

    if (initialState) {
      try {
        Blockly.serialization.workspaces.load(initialState, workspace)
      } catch {
        // A stale or hand-edited save - start blank rather than crash.
      }
    }

    const emit = () => {
      const state = Blockly.serialization.workspaces.save(workspace)
      const python = SCRIPT_HEADER + pythonGenerator.workspaceToCode(workspace)
      onChangeRef.current(state, python)
    }

    const listener = (event: Blockly.Events.Abstract) => {
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
    const raf = requestAnimationFrame(() => Blockly.svgResize(workspace))

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      workspace.removeChangeListener(listener)
      workspace.dispose()
    }
  }, [])

  // Absolute rather than h-full: Blockly measures its host at inject time, and
  // a flex child that has not been laid out yet measures zero, which left the
  // workspace as a 150px stub until something forced a resize.
  return <div ref={hostRef} className="absolute inset-0" />
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
    componentStyles: {
      workspaceBackgroundColour: 'hsl(var(--background))',
      toolboxBackgroundColour: 'hsl(var(--card))',
      toolboxForegroundColour: 'hsl(var(--foreground))',
      flyoutBackgroundColour: 'hsl(var(--muted))',
      flyoutForegroundColour: 'hsl(var(--foreground))',
      flyoutOpacity: 1,
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
