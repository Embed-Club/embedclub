/**
 * Shared handle on the page chrome that floats above the content: the floating
 * dock and the scrollbar.
 *
 * Neither can inherit the palette of the surface it is sitting on - the dock is
 * fixed above every section, and the scrollbar belongs to the document, whose
 * theme only describes the page as a whole. Two ids are rendered by
 * `FloatingDock` (desktop pill and mobile toggle), and anything that paints a
 * full-viewport sheet across the dock - the theme waves between sections - has
 * to pin it explicitly. Keeping the ids and the writes in one module means those
 * writers cannot drift apart.
 */
export const DOCK_IDS = ['embedthon-floating-dock', 'embedthon-floating-dock-mobile'] as const

export type DockTheme = 'light' | 'dark'

export const WAVE_IDS = ['embedthon-wave-hero', 'embedthon-wave-schedule'] as const

/** Points every dock variant at a palette. */
export function setDockTheme(theme: DockTheme) {
  for (const id of DOCK_IDS) {
    document.getElementById(id)?.setAttribute('data-theme', theme)
  }
}

/**
 * True while a wave sheet is mid-sweep. It paints its own background over the
 * dock and sets the dock's palette from its own scroll trigger, so other writers
 * have to stand down or the two fight on every frame.
 */
export function isWavePainting(): boolean {
  return WAVE_IDS.some((id) => {
    const wave = document.getElementById(id)
    if (!wave) return false
    const style = window.getComputedStyle(wave)
    return style.display !== 'none' && Number(style.opacity) > 0.01
  })
}

/**
 * Repaints the scrollbar from the palette of the surface in view.
 *
 * The scrollbar is drawn by the document element, so it reads whatever `--primary`
 * and `--background` the document has - which is the page-wide theme, not the
 * section being read. Copying those two values from the surfaced element keeps
 * the thumb the same copper as the section instead of the document's.
 *
 * The values are read off the live element, never written as literals, so the
 * scrollbar always tracks the tokens in `globals.css`. A null surface means the
 * content does not declare a palette of its own, and the document's own values
 * already apply - so the overrides are dropped rather than guessed.
 */
export function setScrollbarPalette(surface: Element | null) {
  const root = document.documentElement

  if (!surface) {
    root.style.removeProperty('--scrollbar-thumb')
    root.style.removeProperty('--scrollbar-track')
    return
  }

  const style = window.getComputedStyle(surface)
  const primary = style.getPropertyValue('--primary').trim()
  const background = style.getPropertyValue('--background').trim()

  if (primary) root.style.setProperty('--scrollbar-thumb', primary)
  if (background) root.style.setProperty('--scrollbar-track', background)
}
