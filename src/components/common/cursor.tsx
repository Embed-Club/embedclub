'use client'
import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if touch device
    const isTouchDevice =
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

    if (isTouchDevice) {
      return
    }

    let rafId: number
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const move = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      setIsVisible(true)

      if (!rafId) {
        const animate = () => {
          currentX += (targetX - currentX) * 0.15
          currentY += (targetY - currentY) * 0.15

          setPos({ x: currentX, y: currentY })

          if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
            rafId = requestAnimationFrame(animate)
          } else {
            rafId = 0
          }
        }
        rafId = requestAnimationFrame(animate)
      }
    }

    const leave = () => {
      setIsVisible(false)
    }

    const enter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    document.addEventListener('mouseenter', enter)

    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      document.removeEventListener('mouseenter', enter)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Don't render on touch devices or before mount
  if (!mounted) {
    return null
  }

  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
        pointerEvents: 'none',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#ffffff', // White base color works best with difference blend mode
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        zIndex: 9999,
        mixBlendMode: 'difference', // Inverts colors: white becomes opposite of background
      }}
    />
  )
}
