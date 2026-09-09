'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Image, { type ImageProps } from 'next/image'
import { type ImgHTMLAttributes, useState } from 'react'

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
  fill,
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn('relative', fill ? 'h-full w-full' : 'block w-full', wrapperClassName)}>
      <Image
        {...props}
        fill={fill}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
      {!loaded && <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />}
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
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn('relative h-full w-full', wrapperClassName)}>
      {/* biome-ignore lint/a11y/useAltText: alt is forwarded via ...props */}
      <img
        {...props}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        onError={(e) => {
          setLoaded(true)
          onError?.(e)
        }}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
      {!loaded && <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />}
    </div>
  )
}
