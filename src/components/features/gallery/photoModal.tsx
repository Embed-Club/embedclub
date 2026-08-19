'use client'

import { cutoutCardSurfaceShadowClassName } from '@/components/common/cutoutCard'
import type { MasonryItem } from '@/components/features/gallery/masonry'
import { useCardMorph } from '@/hooks/useCardMorph'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { SquareArrowOutUpRight, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface GalleryPhotoModalProps {
  photo: MasonryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The clicked card's box, so the panel can grow out of it. */
  originRect?: DOMRect | null
}

/**
 * A gallery photo at full size, grown out of the card that opened it.
 *
 * Clicking a photo used to `window.open` the original file, which handed the
 * visitor a bare image on a blank tab with no caption and no way back except
 * the tab strip. The link to the original is still here, as a choice rather
 * than the only outcome.
 */
export function GalleryPhotoModal({
  photo,
  open,
  onOpenChange,
  originRect,
}: GalleryPhotoModalProps) {
  // Nothing rendered until it is open: the morph measures the panel in a layout
  // effect, so the panel has to exist the moment that effect runs.
  if (!photo || !open || typeof document === 'undefined') return null

  return createPortal(
    <GalleryPhotoModalPanel
      photo={photo}
      originRect={originRect}
      onClose={() => onOpenChange(false)}
    />,
    document.body,
  )
}

/** The panel itself. Split out so it mounts and unmounts with the open flag. */
function GalleryPhotoModalPanel({
  photo,
  originRect,
  onClose,
}: {
  photo: MasonryItem
  originRect?: DOMRect | null
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const { panelRef, innerRef, bodyRef, overlayRef, requestClose } = useCardMorph({
    originRect,
    onClose,
    reduceMotion,
  })

  useOutsideClick(panelRef, requestClose)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [requestClose])

  const aspectRatio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1

  // The panel wants the original, but a row whose original is missing from
  // storage would otherwise open to a broken image while the card beside it
  // shows fine - the card renders a resized variant, which is a different file.
  // Fall back to that variant rather than showing nothing.
  const [src, setSrc] = useState(photo.url)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto px-4 md:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
      // biome-ignore lint/a11y/useSemanticElements: a native <dialog> is only
      // modal via showModal(), which puts it in the browser's top layer - that
      // layer establishes its own containing block and stacking context, which
      // breaks the measured transform the morph animates. Same reason as every
      // other modal on the site.
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption || 'Gallery photo'}
    >
      {/* Blur from md up only: backdrop-filter is re-evaluated every frame
          while the panel moves across it, which is costly on a weak phone. */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 h-full w-full bg-black/80 md:backdrop-blur-lg"
      />

      <div
        ref={panelRef}
        style={{ opacity: 0 }}
        className={cn(
          'relative z-[60] my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-card text-card-foreground',
          cutoutCardSurfaceShadowClassName,
        )}
      >
        {/* Counter-scaled against the panel, so the photo holds its true
            proportions while the frame morphs. */}
        <div ref={innerRef} className="h-full w-full">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close photo"
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-90 shadow-sm backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>

          <div ref={bodyRef}>
            {/* The card shows the `tablet` size; the panel loads the original.
                Capped by viewport height so a tall photo stays whole on screen
                rather than running past the fold. */}
            <div
              className="relative w-full overflow-hidden bg-muted"
              style={{ aspectRatio, maxHeight: '75svh' }}
            >
              {/* Plain <img>: gallery files are served from whichever storage
                  the environment is configured for, and next/image would need
                  every such host allow-listed in next.config. */}
              <img
                src={src}
                alt={photo.caption || ''}
                aria-hidden={!photo.caption}
                onError={() => setSrc((current) => (current === photo.img ? current : photo.img))}
                className="h-full w-full object-contain"
              />
            </div>

            {(photo.caption || src) && (
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                {photo.caption ? (
                  <p className="text-sm text-muted-foreground">{photo.caption}</p>
                ) : (
                  <span />
                )}
                {/* Points at whatever actually loaded, so this can't hand the
                    visitor the same missing file the panel just fell back from. */}
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <SquareArrowOutUpRight className="h-4 w-4" />
                  Open original
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
