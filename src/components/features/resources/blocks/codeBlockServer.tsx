import { CodeTabs } from '@/components/animate-ui/components/codeTabs'
import { highlightCode } from '@/lib/shiki'
import type { CodeBlock } from '@/payload/payload-types'

interface CodeBlockProps {
  block: CodeBlock
}

export async function CodeBlockServer({ block }: CodeBlockProps) {
  const { code, language, caption } = block

  let highlightedCode = ''
  try {
    highlightedCode = await highlightCode(code, language || 'text')
  } catch (error) {
    console.error('Shiki error:', error)
    highlightedCode = `<pre><code>${code}</code></pre>`
  }

  const codes = {
    [caption || language || 'code']: {
      code,
      language: language || 'text',
      highlightedHtml: highlightedCode,
    },
  }

  return <CodeTabs codes={codes} />
}
