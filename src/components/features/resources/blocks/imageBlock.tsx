import type { ImageBlock as ImageBlockType, Media } from '@/payload/payload-types'
import Image from 'next/image'

interface ImageBlockProps {
  block: ImageBlockType
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { image, caption, size } = block

  if (!image || typeof image === 'number') return null

  const media = image as Media
  if (!media.url) return null

  const sizeClasses = {
    small: 'max-w-sm mx-auto',
    medium: 'max-w-2xl mx-auto',
    large: 'w-full',
  }

  return (
    <figure
      className={`my-12 flex flex-col gap-3 ${sizeClasses[size || 'large']} animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 group">
        <Image
          src={media.url}
          alt={caption || media.alt || ''}
          width={media.width || 1200}
          height={media.height || 800}
          className="w-full h-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none dark:from-black/40" />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground font-medium italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
