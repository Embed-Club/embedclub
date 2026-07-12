'use client'

import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type ThemedStarsBackgroundProps = {
  children: React.ReactNode
  speed?: number
  factor?: number
  pointerEvents?: boolean
}

export function ThemedStarsBackground({
  children,
  speed = 10,
  factor = 0.5,
  pointerEvents = true,
}: ThemedStarsBackgroundProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fabric texture layered over the star-field gradient (multiply on light,
  // overlay on dark) so the home scene matches the rest of the site's panels.
  const darkBg =
    "bg-[url('/textures/fabric-of-squares.png'),radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)] bg-blend-overlay"
  const lightBg =
    "bg-[url('/textures/fabric-of-squares.png'),radial-gradient(ellipse_at_bottom,_#e5e5e5_0%,_#fff_100%)] bg-blend-multiply"

  // If not mounted yet, render with default dark theme
  if (!mounted) {
    return (
      <StarsBackground
        speed={speed}
        factor={factor}
        pointerEvents={pointerEvents}
        starColor="#fff"
        className={darkBg}
      >
        {children}
      </StarsBackground>
    )
  }

  const currentTheme = resolvedTheme || theme
  const isLightMode = currentTheme === 'light'

  return (
    <StarsBackground
      speed={speed}
      factor={factor}
      pointerEvents={pointerEvents}
      starColor={isLightMode ? '#000' : '#fff'}
      className={isLightMode ? lightBg : darkBg}
    >
      {children}
    </StarsBackground>
  )
}
