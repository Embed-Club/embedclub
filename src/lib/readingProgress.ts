/**
 * How far through the article the reader is, 0-1.
 *
 * Shared by the desktop table-of-contents rail and the mobile progress bar so
 * the two can never disagree about what "68%" means.
 *
 * Two things make this not a plain `scrollTop / scrollHeight`:
 *
 * - The page scrolls inside ContentPanel, not the window, so `window.scrollY`
 *   would read 0 forever.
 * - That container also holds the full-viewport SiteFooter. Dividing by its
 *   own `scrollHeight` caps the bar around 80% at the end of the actual
 *   reading, with the rest of the travel spent on footer. `[data-toc-scope]`
 *   bounds the measurement to the article instead.
 */
export function measureReadingProgress(): number | null {
  const scroller = document.querySelector('[data-scroll-container]')
  if (!scroller) return null

  const scope = document.querySelector('[data-toc-scope]')
  if (scope) {
    const scrollerTop = scroller.getBoundingClientRect().top
    const rect = scope.getBoundingClientRect()
    const readable = rect.height - scroller.clientHeight
    const scrolled = scrollerTop - rect.top
    return readable > 0 ? Math.min(1, Math.max(0, scrolled / readable)) : 1
  }

  const scrollable = scroller.scrollHeight - scroller.clientHeight
  return scrollable > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / scrollable)) : 0
}
