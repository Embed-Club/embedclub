import type React from "react"

import { cn } from "@/lib/utils"

export type TextureVariant =
  | "fabric-of-squares"
  | "grid-noise"
  | "inflicted"
  | "debut-light"
  | "groovepaper"
  | "none"

interface BackgroundImageTextureProps {
  variant?: TextureVariant
  opacity?: number
  className?: string
  /** Extra classes on the texture layer itself (e.g. theme-aware blend modes). */
  textureClassName?: string
  children?: React.ReactNode
}

const textureMap: Record<Exclude<TextureVariant, "none">, string> = {
  "fabric-of-squares": "/textures/fabric-of-squares.png",
  "grid-noise": "/textures/grid-noise.png",
  inflicted: "/textures/inflicted.png",
  "debut-light": "/textures/debut-light.png",
  groovepaper: "/textures/groovepaper.png",
}

export function BackgroundImageTexture({
  variant = "fabric-of-squares",
  opacity = 0.5,
  className,
  textureClassName,
  children,
}: BackgroundImageTextureProps) {
  const textureUrl = variant !== "none" ? textureMap[variant] : null

  return (
    <div className={cn("relative", className)}>
      {textureUrl && (
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0", textureClassName)}
          style={{
            backgroundImage: `url(${textureUrl})`,
            backgroundRepeat: "repeat",
            opacity,
          }}
        />
      )}
      {children && <div className="relative">{children}</div>}
    </div>
  )
}

/**
 * Panel texture: fabric-of-squares grain scoped to a container (sidebar box,
 * main content panel) instead of the whole viewport — the gaps between panels
 * stay clean. Mount as the first child of a `relative` container; it stretches
 * to the container's full content height and inherits its rounding.
 *
 * The PNG is light-gray-on-white, so dark mode inverts it and blends with
 * `screen`; light mode multiplies.
 */
export function PanelTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-repeat opacity-[0.28] mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-screen dark:invert"
      style={{ backgroundImage: "url(/textures/fabric-of-squares.png)" }}
    />
  )
}
