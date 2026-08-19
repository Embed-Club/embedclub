import { type Highlighter, createHighlighter } from 'shiki'

// Cache the promise, not the resolved highlighter. Caching the value leaves a
// window between the first call and its resolution where every concurrent
// caller still sees null and builds its own highlighter - each one carrying the
// full set of TextMate grammars plus the oniguruma WASM. That is how a page
// with several code blocks ends up with ten instances and an OOM'd worker.
let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighterInstance() {
  if (highlighterPromise) return highlighterPromise

  highlighterPromise = createHighlighter({
    themes: ['github-dark'],
    langs: [
      'javascript',
      'typescript',
      'python',
      'c',
      'cpp',
      'bash',
      'json',
      'yaml',
      'markdown',
      'html',
      'css',
      'rust',
      'go',
    ],
  }).catch((error) => {
    // Don't cache a rejection - a transient failure would otherwise poison
    // every later call for the lifetime of the process.
    highlighterPromise = null
    throw error
  })

  return highlighterPromise
}

export async function highlightCode(code: string, lang: string) {
  const hl = await getHighlighterInstance()
  return hl.codeToHtml(code, {
    lang,
    theme: 'github-dark',
  })
}
