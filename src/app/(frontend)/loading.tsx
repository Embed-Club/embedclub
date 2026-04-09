'use client'

import {
  Progress,
  ProgressTrack,
  ProgressValue,
} from '@/components/animate-ui/components/base/progress'
import * as React from 'react'

export default function Loading() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const duration = 3000 // match your async wait in page.tsx
    const steps = 60 // smooth animation (60 frames per duration)
    const stepTime = duration / steps // milliseconds per step
    const increment = 100 / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      setProgress(Math.min(current, 100))
    }, stepTime)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <Progress value={progress} className="w-[300px] space-y-2">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm">
            <ProgressValue />%
          </span>
        </div>
        <ProgressTrack />
      </Progress>
    </div>
  )
}
