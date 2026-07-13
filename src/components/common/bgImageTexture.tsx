import type React from 'react'

import { cn } from '@/lib/utils'

export type TextureVariant =
  | 'fabric-of-squares'
  | 'grid-noise'
  | 'inflicted'
  | 'debut-light'
  | 'groovepaper'
  | 'none'

interface BackgroundImageTextureProps {
  variant?: TextureVariant
  opacity?: number
  className?: string
  /** Extra classes on the texture layer itself (e.g. theme-aware blend modes). */
  textureClassName?: string
  children?: React.ReactNode
}

const textureMap: Record<Exclude<TextureVariant, 'none'>, string> = {
  'fabric-of-squares': '/textures/fabric-of-squares.png',
  'grid-noise': '/textures/grid-noise.png',
  inflicted: '/textures/inflicted.png',
  'debut-light': '/textures/debut-light.png',
  groovepaper: '/textures/groovepaper.png',
}

export function BackgroundImageTexture({
  variant = 'fabric-of-squares',
  opacity = 0.5,
  className,
  textureClassName,
  children,
}: BackgroundImageTextureProps) {
  const textureUrl = variant !== 'none' ? textureMap[variant] : null

  return (
    <div className={cn('relative', className)}>
      {textureUrl && (
        <div
          aria-hidden="true"
          className={cn('pointer-events-none absolute inset-0', textureClassName)}
          style={{
            backgroundImage: `url(${textureUrl})`,
            backgroundRepeat: 'repeat',
            opacity,
          }}
        />
      )}
      {children && <div className="relative">{children}</div>}
    </div>
  )
}

// Panel texturing lives in globals.css as the `.texture-panel` class — a real
// background layer (attachment: local, blend multiply/overlay) with no extra
// DOM and no layout impact. This component stays for ad-hoc texture sections.
