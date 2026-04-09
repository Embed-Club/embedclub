'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { gsap } from 'gsap'
import type React from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const useMedia = <T,>(queries: string[], values: T[], defaultValue: T): T => {
  const get = useCallback(() => {
    if (typeof window === 'undefined') return defaultValue
    const index = queries.findIndex((q) => window.matchMedia(q).matches)
    return values[index] ?? defaultValue
  }, [queries, values, defaultValue])

  const [value, setValue] = useState<T>(get)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setValue(get)
    for (const q of queries) {
      window.matchMedia(q).addEventListener('change', handler)
    }
    return () => {
      for (const q of queries) {
        window.matchMedia(q).removeEventListener('change', handler)
      }
    }
  }, [get, queries])

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

  const getInitialPosition = useCallback(
    (item: GridItem, containerRect: DOMRect | undefined) => {
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
    },
    [animateFrom],
  )

  useEffect(() => {
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true))
  }, [items])

  useEffect(() => {
    setLoadedIds(new Set())
    for (const item of items) {
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
    }
  }, [items])

  const { grid, containerHeight } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], containerHeight: 0 }
    const gap = 16
    const baseHeight = Math.max(160, Math.min(320, (width / itemsPerRow) * 0.6))
    const gridItems: GridItem[] = []

    let rowBase: Item[] = []
    let rowAspectSum = 0
    let y = 0

    const flushRow = (rowItems: Item[], currentAspectSum: number, isLastRow: boolean) => {
      if (!rowItems.length) return
      const gaps = gap * (rowItems.length - 1)
      const rowWidth = width - gaps
      const scale = isLastRow ? 1 : rowWidth / (currentAspectSum * baseHeight)
      const rowHeight = baseHeight * scale
      let x = 0

      for (const item of rowItems) {
        const aspect = item.width > 0 && item.height > 0 ? item.width / item.height : 1
        const w = aspect * rowHeight
        gridItems.push({ ...item, x, y, w, h: rowHeight })
        x += w + gap
      }

      y += rowHeight + gap
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const aspect = item.width > 0 && item.height > 0 ? item.width / item.height : 1
      const nextWidth = (rowAspectSum + aspect) * baseHeight + gap * rowBase.length
      if (nextWidth > width && rowBase.length > 0) {
        flushRow(rowBase, rowAspectSum, false)
        rowBase = []
        rowAspectSum = 0
      }
      rowBase.push(item)
      rowAspectSum += aspect
      if (i === items.length - 1) {
        flushRow(rowBase, rowAspectSum, true)
      }
    }

    const height = Math.max(0, y - gap)
    return { grid: gridItems, containerHeight: height }
  }, [items, itemsPerRow, width])

  const hasMounted = useRef(false)

  useLayoutEffect(() => {
    if (!imagesReady) return
    const containerRect = containerRef.current?.getBoundingClientRect()

    for (let i = 0; i < grid.length; i++) {
      const item = grid[i]
      const selector = `[data-key="${item.id}"]`
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h }

      if (!hasMounted.current) {
        const start = getInitialPosition(item, containerRect)
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
            ease: ease,
            delay: i * stagger,
          },
        )
      } else {
        gsap.to(selector, {
          ...animProps,
          duration,
          ease: ease,
          overwrite: 'auto',
        })
      }
    }

    hasMounted.current = true
  }, [grid, imagesReady, stagger, blurToFocus, duration, ease, getInitialPosition, containerRef])

  const handleMouseEnter = useCallback(
    (id: string, element: HTMLElement) => {
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
    },
    [scaleOnHover, hoverScale, colorShiftOnHover],
  )

  const handleMouseLeave = useCallback(
    (id: string, element: HTMLElement) => {
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
    },
    [scaleOnHover, colorShiftOnHover],
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: containerHeight || 'auto' }}
    >
      {grid.map((item) => (
        <button
          type="button"
          key={item.id}
          data-key={item.id}
          className="absolute box-content cursor-pointer bg-transparent border-none p-0 outline-none"
          style={{ willChange: 'transform, width, height, opacity' }}
          onClick={() => window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-[10px]"
            style={{
              backgroundImage: loadedIds.has(item.id) ? `url(\"${item.img}\")` : 'none',
            }}
          >
            {!loadedIds.has(item.id) && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-[10px]" />
            )}
            {colorShiftOnHover && (
              <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export default Masonry
