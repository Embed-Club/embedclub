import { cn } from '@/lib/utils'
import { Fragment } from 'react'

const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g

/**
 * Plain text from the CMS with its line breaks kept and its links clickable.
 *
 * Form and step descriptions are where members paste WhatsApp group links and
 * meeting URLs. Rendered as plain text, those were unclickable - and on the
 * step bar, one long link pushed the whole row off the side of the page.
 */
export function LinkifiedText({ text, className }: { text?: string | null; className?: string }) {
  if (!text?.trim()) return null
  const parts = text.split(URL_RE)
  return (
    <p className={cn('whitespace-pre-line break-words', className)}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            // biome-ignore lint/suspicious/noArrayIndexKey: split output is positional and never reorders
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {part}
          </a>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: split output is positional and never reorders
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </p>
  )
}
