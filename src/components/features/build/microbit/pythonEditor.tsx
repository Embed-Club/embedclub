'use client'

import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'

interface PythonEditorProps {
  value: string
  onChange: (value: string) => void
}

/**
 * CodeMirror with Python highlighting, painted with the site tokens so it
 * follows light and dark mode without a second theme. Uncontrolled after
 * mount: the parent's `value` only wins when it differs from what the
 * editor holds (a switch back from blocks), so typing never fights a re-render.
 */
export function PythonEditor({ value, onChange }: PythonEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // biome-ignore lint/correctness/useExhaustiveDependencies: `value` seeds the document once; later external changes are applied by the effect below
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          python(),
          siteTheme,
          syntaxHighlighting(siteHighlight),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [value])

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />
}

const siteTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    fontSize: '14px',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    lineHeight: '1.6',
  },
  '.cm-content': { caretColor: 'hsl(var(--primary))' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'hsl(var(--primary))' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'hsl(var(--primary) / 0.25)',
  },
  '.cm-activeLine': { backgroundColor: 'hsl(var(--muted) / 0.5)' },
  '.cm-gutters': {
    backgroundColor: 'hsl(var(--card))',
    color: 'hsl(var(--muted-foreground))',
    borderRight: '1px solid hsl(var(--border))',
  },
  '.cm-activeLineGutter': { backgroundColor: 'hsl(var(--muted))' },
  '&.cm-focused': { outline: 'none' },
})

/**
 * Token colours from the site palette: keywords in copper, everything else in
 * shades the theme already has. Enough contrast to read, no second palette.
 */
const siteHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: 'hsl(var(--primary))' },
  {
    tag: [tags.definition(tags.variableName), tags.function(tags.variableName)],
    fontWeight: '600',
  },
  { tag: [tags.string, tags.special(tags.string)], color: 'hsl(var(--accent-foreground))' },
  { tag: [tags.number, tags.bool, tags.null], color: 'hsl(var(--primary) / 0.85)' },
  { tag: tags.comment, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
  { tag: [tags.operator, tags.punctuation], color: 'hsl(var(--muted-foreground))' },
])
