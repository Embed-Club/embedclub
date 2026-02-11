'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Skeleton } from '@/components/ui/skeleton'

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue
    return values[queries.findIndex((q) => window.matchMedia(q).matches)] ?? defaultValue
  }

  const [value, setValue] = useState<number>(get)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setValue(get)
    queries.forEach((q) => matchMedia(q).addEventListener('change', handler))
    return () => queries.forEach((q) => window.matchMedia(q).removeEventListener('change', handler))
  }, [queries])

  return value
}

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.src = src
          img.onload = img.onerror = () => resolve()
        }),
    ),
  )
}

interface Item {
  id: string
  img: string
  url: string
  height: number
  width: number
}

interface GridItem extends Item {
  x: number
  y: number
  w: number
  h: number
}

interface MasonryProps {
  items: Item[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random'
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
  colorShiftOnHover?: boolean
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}) => {
  const itemsPerRow = useMedia(
    ['(min-width:1600px)', '(min-width:1100px)', '(min-width:700px)'],
    [4, 3, 2],
    1,
  )

  const [containerRef, { width }] = useMeasure<HTMLDivElement>()
  const [imagesReady, setImagesReady] = useState(false)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: item.x, y: item.y }

    let direction = animateFrom
    if (animateFrom === 'random') {
      const dirs = ['top', 'bottom', 'left', 'right']
      direction = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 }
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 }
      case 'left':
        return { x: -200, y: item.y }
      case 'right':
        return { x: window.innerWidth + 200, y: item.y }
      case 'center':
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        }
      default:
        return { x: item.x, y: item.y + 100 }
    }
  }

  useEffect(() => {
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true))
  }, [items])

  useEffect(() => {
    setLoadedIds(new Set())
    items.forEach((item) => {
      const img = new Image()
      img.src = item.img
      img.onload = img.onerror = () => {
        setLoadedIds((prev) => {
          if (prev.has(item.id)) return prev
          const next = new Set(prev)
          next.add(item.id)
          return next
        })
      }
    })
  }, [items])

  const { grid, containerHeight } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], containerHeight: 0 }
    const gap = 16
    const baseHeight = Math.max(160, Math.min(320, (width / itemsPerRow) * 0.6))
    const gridItems: GridItem[] = []

    let row: Item[] = []
    let rowAspectSum = 0
    let y = 0

    const flushRow = (isLastRow: boolean) => {
      if (!row.length) return
      const gaps = gap * (row.length - 1)
      const rowWidth = width - gaps
      const scale = isLastRow ? 1 : rowWidth / (rowAspectSum * baseHeight)
      const rowHeight = baseHeight * scale
      let x = 0

      row.forEach((item) => {
        const aspect = item.width > 0 && item.height > 0 ? item.width / item.height : 1
        const w = aspect * rowHeight
        gridItems.push({ ...item, x, y, w, h: rowHeight })
        x += w + gap
      })

      y += rowHeight + gap
      row = []
      rowAspectSum = 0
    }

    items.forEach((item, index) => {
      const aspect = item.width > 0 && item.height > 0 ? item.width / item.height : 1
      const nextWidth = (rowAspectSum + aspect) * baseHeight + gap * row.length
      if (nextWidth > width && row.length > 0) {
        flushRow(false)
      }
      row.push(item)
      rowAspectSum += aspect
      if (index === items.length - 1) {
        flushRow(true)
      }
    })

    const height = Math.max(0, y - gap)
    return { grid: gridItems, containerHeight: height }
  }, [items, itemsPerRow, width])

  const hasMounted = useRef(false)

  useLayoutEffect(() => {
    if (!imagesReady) return

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h }

      if (!hasMounted.current) {
        const start = getInitialPosition(item)
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: 'blur(10px)' }),
          },
          {
            opacity: 1,
            ...animProps,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.8,
            ease: 'power3.out',
            delay: index * stagger,
          },
        )
      } else {
        gsap.to(selector, {
          ...animProps,
          duration,
          ease,
          overwrite: 'auto',
        })
      }
    })

    hasMounted.current = true
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease])

  const handleMouseEnter = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 })
    }
  }

  const handleMouseLeave = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay') as HTMLElement
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 })
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: containerHeight || 'auto' }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content"
          style={{ willChange: 'transform, width, height, opacity' }}
          onClick={() => window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-[10px]"
            style={{
              backgroundImage: loadedIds.has(item.id)
                ? `url(\"${item.img}\")`
                : 'none',
            }}
          >
            {!loadedIds.has(item.id) && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-[10px]" />
            )}
            {colorShiftOnHover && (
              <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
