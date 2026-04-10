'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export default function Loading() {
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/home'
  const [fillProgress, setFillProgress] = useState(0)

  useEffect(() => {
    if (isLandingPage) return
    
    const duration = 800
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      setFillProgress(Math.min(elapsed / duration, 1))
      if (elapsed >= duration) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [isLandingPage])

  // Skip loader content if the layout shell is already handling the high-end intro
  if (isLandingPage) return <div className="fixed inset-0 z-[999] bg-background" />

  return (
    <div className="fixed inset-0 z-[999] bg-background flex items-center justify-center">
      <div className="relative w-36 h-36">
           {/* Greyscale Base */}
           <img 
            src="/embedClubLogo-Dark.svg" 
            className="absolute inset-0 w-full h-full object-contain grayscale opacity-20 hidden dark:block" 
           />
           <img 
            src="/embedClubLogo-Light.svg" 
            className="absolute inset-0 w-full h-full object-contain grayscale opacity-20 dark:hidden" 
           />
           
           {/* Colored Fill */}
           <div 
            className="absolute inset-0 overflow-hidden" 
            style={{ clipPath: `inset(${(1 - fillProgress) * 100}% 0 0 0)` }}
           >
               <img 
                src="/embedClubLogo-Dark.svg" 
                className="w-full h-full object-contain hidden dark:block" 
               />
               <img 
                src="/embedClubLogo-Light.svg" 
                className="w-full h-full object-contain dark:hidden" 
               />
           </div>
       </div>
    </div>
  )
}
