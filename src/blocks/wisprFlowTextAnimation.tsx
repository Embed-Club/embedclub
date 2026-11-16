'use client'

import { cn } from '@/lib/utils'
import { useId } from 'react'

interface WisprFlowTextAnimationProps {
  text: string
  className?: string
}

/** A compact, token-coloured adaptation of the Aceternity Wispr Flow registry block. */
export function WisprFlowTextAnimation({ text, className }: WisprFlowTextAnimationProps) {
  const pathId = useId().replace(/:/g, '')

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 760 120"
      className={cn('h-auto w-full overflow-visible text-primary', className)}
    >
      <path
        id={pathId}
        d="M-30 88C104 2 208 10 332 68S566 124 790 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      <text className="fill-current text-[23px] font-semibold tracking-[0.16em]" opacity="0.75">
        <textPath href={`#${pathId}`} startOffset="0%">
          {text}
          <animate
            attributeName="startOffset"
            dur="26s"
            from="-100%"
            to="0%"
            repeatCount="indefinite"
          />
        </textPath>
      </text>
    </svg>
  )
}
