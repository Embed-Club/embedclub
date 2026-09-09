'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Image, { type ImageProps } from 'next/image'
import { type ImgHTMLAttributes, type RefObject, useEffect, useRef, useState } from 'react'

/**
 * Whether an image element has pixels on screen.
 *
 * `onLoad` alone cannot answer this. Server-rendered markup starts downloading
 * its images while the HTML is still parsing, so a cached one is often already
 * finished before React hydrates and attaches the handler - the event fired
 * before anyone was listening, and a placeholder keyed off it would never
 * clear. Some lazy images are worse still: inside an overflow-hidden track they
 * reach `naturalWidth > 0` without ever firing `load` or settling `decode()`.
 *
 * So ask the element instead, and poll it as a last resort. Dimensions mean
 * there is a bitmap.
 */
export function useImagePainted(ref: RefObject<HTMLImageElement | null>, src: unknown) {
  const [painted, setPainted] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run per src
  useEffect(() => {
    const img = ref.current
    if (!img) return
    if (img.naturalWidth > 0) {
      setPainted(true)
      return
    }
    setPainted(false)

    let cancelled = false
    const timers: { poll?: ReturnType<typeof setInterval> } = {}
    const done = () => {
      if (timers.poll) clearInterval(timers.poll)
      // A decode failure lands here too: showing a broken image beats leaving a
      // placeholder up forever.
      if (!cancelled) setPainted(true)
    }

    img.decode().then(done, done)
    timers.poll = setInterval(() => {
      if (img.naturalWidth > 0) done()
    }, 200)

    return () => {
      cancelled = true
      if (timers.poll) clearInterval(timers.poll)
    }
  }, [ref, src])

  return [painted, setPainted] as const
}

export interface ImageWithSkeletonProps extends ImageProps {
  /** Extra classes for the placeholder box. */
  skeletonClassName?: string
  /** Classes for the wrapper div that becomes `relative` (what `fill` sizes to). */
  wrapperClassName?: string
}

/** `next/image`, with a `Skeleton` shown until the image has painted. */
export function ImageWithSkeleton({
  className,
  skeletonClassName,
  wrapperClassName,
  onLoad,
  onError,
  fill,
  ...props
}: ImageWithSkeletonProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [painted, setPainted] = useImagePainted(ref, props.src)

  return (
    <div className={cn('relative', fill ? 'h-full w-full' : 'block w-full', wrapperClassName)}>
      <Image
        {...props}
        ref={ref}
        fill={fill}
        onLoad={(e) => {
          setPainted(true)
          onLoad?.(e)
        }}
        onError={(e) => {
          setPainted(true)
          onError?.(e)
        }}
        className={cn(
          'transition-opacity duration-300',
          painted ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
      {!painted && <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />}
    </div>
  )
}

export interface ImgWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
  skeletonClassName?: string
  wrapperClassName?: string
}

/** Plain `<img>`, with a `Skeleton` shown until the image has painted. For remote/arbitrary hosts `next/image` can't optimise. */
export function ImgWithSkeleton({
  className,
  skeletonClassName,
  wrapperClassName,
  onLoad,
  onError,
  ...props
}: ImgWithSkeletonProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [painted, setPainted] = useImagePainted(ref, props.src)

  return (
    <div className={cn('relative h-full w-full', wrapperClassName)}>
      {/* biome-ignore lint/a11y/useAltText: alt is forwarded via ...props */}
      <img
        {...props}
        ref={ref}
        onLoad={(e) => {
          setPainted(true)
          onLoad?.(e)
        }}
        onError={(e) => {
          setPainted(true)
          onError?.(e)
        }}
        className={cn(
          'transition-opacity duration-300',
          painted ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
      {!painted && <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />}
    </div>
  )
}
