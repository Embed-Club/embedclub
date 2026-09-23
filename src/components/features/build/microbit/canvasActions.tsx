'use client'

import { cn } from '@/lib/utils'
import {
  Copy,
  type LucideIcon,
  Redo2,
  Scan,
  Trash2,
  Undo2,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

export type CanvasAction =
  | 'undo'
  | 'redo'
  | 'duplicate'
  | 'delete'
  | 'tidy'
  | 'zoomIn'
  | 'zoomOut'
  | 'fit'

interface CanvasActionsProps {
  canUndo: boolean
  canRedo: boolean
  /** A block is selected and can be copied or removed. */
  hasSelection: boolean
  onAction: (action: CanvasAction) => void
}

/**
 * Buttons for what Blockly otherwise hides behind a right-click or a
 * long-press: undo, duplicate, delete, tidy. On a phone those gestures are
 * guesswork, and dragging a block to the bin with a thumb over it is worse,
 * so each one gets a finger-sized button floating over the canvas.
 */
export function CanvasActions({ canUndo, canRedo, hasSelection, onAction }: CanvasActionsProps) {
  return (
    <>
      <Cluster className="right-2 top-2 sm:right-3 sm:top-3" label="Edit">
        <Action icon={Undo2} label="Undo" disabled={!canUndo} onClick={() => onAction('undo')} />
        <Action icon={Redo2} label="Redo" disabled={!canRedo} onClick={() => onAction('redo')} />
        <Divider />
        <Action
          icon={Copy}
          label="Duplicate selected block"
          disabled={!hasSelection}
          onClick={() => onAction('duplicate')}
        />
        <Action
          icon={Trash2}
          label="Delete selected block"
          disabled={!hasSelection}
          destructive
          onClick={() => onAction('delete')}
        />
        <Divider />
        <Action icon={WandSparkles} label="Tidy up blocks" onClick={() => onAction('tidy')} />
      </Cluster>

      <Cluster className="bottom-24 right-2 flex-col sm:right-3" label="Zoom">
        <Action icon={ZoomIn} label="Zoom in" onClick={() => onAction('zoomIn')} />
        <Action icon={ZoomOut} label="Zoom out" onClick={() => onAction('zoomOut')} />
        <Action icon={Scan} label="Fit all blocks" onClick={() => onAction('fit')} />
      </Cluster>
    </>
  )
}

function Cluster({
  className,
  label,
  children,
}: {
  className: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      // Blockly deselects a block the moment focus leaves the canvas, so a
      // button that took focus on press would find nothing to duplicate or
      // delete by the time its click fired. Keep focus on the canvas instead.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'absolute z-10 flex items-center gap-0.5 rounded-xl border border-border bg-card/95 p-1 shadow-lg shadow-black/20',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
}

function Action({
  icon: Icon,
  label,
  disabled,
  destructive,
  onClick,
}: {
  icon: LucideIcon
  label: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35 sm:size-8',
        destructive
          ? 'hover:bg-destructive/15 hover:text-destructive'
          : 'hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="size-[18px] sm:size-4" aria-hidden />
    </button>
  )
}
