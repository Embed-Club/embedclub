import { type Highlighter, createHighlighter } from 'shiki'

let highlighter: Highlighter | null = null

export async function getHighlighterInstance() {
  if (highlighter) return highlighter

  highlighter = await createHighlighter({
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
  })

  return highlighter
}

export async function highlightCode(code: string, lang: string) {
  const hl = await getHighlighterInstance()
  return hl.codeToHtml(code, {
    lang,
    theme: 'github-dark',
  })
}
