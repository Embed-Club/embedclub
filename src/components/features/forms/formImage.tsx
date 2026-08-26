import { cn } from '@/lib/utils'
import type { FormMedia } from '@/payload/payload-types'
import Image from 'next/image'

/**
 * a member-attached picture inside a form - header banner, step banner, the
 * diagram under a question, or a standalone image row.
 *
 * Always lazy: a form with a QR code on step three should not pay for it on
 * step one.
 *
 * Every slot caps its height. members upload whatever their phone took, and
 * an unbounded portrait shot renders taller than the viewport - the question
 * it belongs to ends up pushed off screen entirely. Google Forms solves this
 * by making the author resize; capping per slot means they never have to.
 */
const MAX_HEIGHTS = {
  /** Under the form title. Wide banner, not a hero. */
  header: 'max-h-[240px]',
  /** Top of a step. Smaller again - the questions are the point. */
  step: 'max-h-[200px]',
  /** Between a question's label and its input. */
  question: 'max-h-[280px]',
  /** A standalone image row: the picture *is* the content, so it gets room. */
  standalone: 'max-h-[420px]',
} as const

interface FormImageProps {
  media: number | FormMedia | null | undefined
  slot: keyof typeof MAX_HEIGHTS
  className?: string
  /** Shown under the image, e.g. the label of a standalone image row. */
  caption?: string | null
  /** The header banner is the one image worth loading eagerly. */
  priority?: boolean
}

export function FormImage({ media, slot, className, caption, priority }: FormImageProps) {
  // depth 0 leaves an id behind; there is nothing to render from that.
  if (!media || typeof media !== 'object') return null

  const { url, width, height, alt } = media
  if (!url) return null

  return (
    <figure className={cn('space-y-2', className)}>
      <Image
        src={url}
        alt={alt || ''}
        width={width || 900}
        height={height || 600}
        sizes="(max-width: 768px) 100vw, 768px"
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        className={cn(
          'mx-auto h-auto w-auto max-w-full rounded-xl border border-border/60 bg-muted/30 object-contain',
          MAX_HEIGHTS[slot],
        )}
      />
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  )
}
