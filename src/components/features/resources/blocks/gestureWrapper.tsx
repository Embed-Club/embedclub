'use client'

import { useRef, useState } from 'react'

interface GestureWrapperProps {
  children: React.ReactNode
  className?: string
}

export function GestureWrapper({ children, className = '' }: GestureWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const touchStartDistance = useRef(0)
  const startScale = useRef(1)
  const startPan = useRef({ x: 0, y: 0 })
  const startCenter = useRef({ x: 0, y: 0 })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY
      touchStartDistance.current = Math.sqrt(dx * dx + dy * dy)
      startScale.current = scale
      startPan.current = { ...pan }
      startCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (touchStartDistance.current > 0) {
        // Zoom
        const ratio = distance / touchStartDistance.current
        const newScale = Math.min(Math.max(startScale.current * ratio, 1), 3)
        setScale(newScale)

        // Pan with two fingers
        const currentCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        }
        const panDx = currentCenter.x - startCenter.current.x
        const panDy = currentCenter.y - startCenter.current.y

        setPan({
          x: startPan.current.x + panDx,
          y: startPan.current.y + panDy,
        })
      }
    }
  }

  const handleTouchEnd = () => {
    touchStartDistance.current = 0

    if (scale < 1.1) {
      setScale(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(scale * delta, 1), 3)
      setScale(newScale)
    }
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPan({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-muted/40 rounded-xl border border-border inline-block ${className}`}
      style={{ maxWidth: '100%', touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
          display: 'block',
          lineHeight: 0,
        }}
      >
        {children}
      </div>

      {scale > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
