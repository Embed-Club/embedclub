'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query' // Need to check if this exists
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface TagOverflowProps {
  tags: string[]
  className?: string
}

export function TagOverflow({ tags, className }: TagOverflowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [side, setSide] = useState<'top' | 'bottom'>('bottom')
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Use media query hook for better responsive handling
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const threshold = window.innerHeight * 0.7
      setSide(rect.bottom > threshold ? 'top' : 'bottom')
    }
  }, [isOpen])

  if (tags.length <= 2) return null

  const overflowCount = tags.length - 2
  const remainingTags = tags.slice(2)

  const Trigger = (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        'px-2 py-0.5 text-[10px] md:text-xs bg-primary/10 text-primary border border-primary/20 rounded-full font-medium hover:bg-primary/20 transition-colors',
        className,
      )}
    >
      +{overflowCount}
    </button>
  )

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
          <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        </div>
        <PopoverContent
          side={side}
          className="w-auto p-2 bg-zinc-900/90 backdrop-blur-md border-zinc-800 shadow-2xl z-[100]"
        >
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {remainingTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{Trigger}</SheetTrigger>
      <SheetContent side="bottom" className="bg-zinc-900 border-zinc-800 rounded-t-2xl h-[40vh]">
        <SheetHeader>
          <SheetTitle className="text-zinc-100 text-left">All Tags</SheetTitle>
        </SheetHeader>
        <div className="flex flex-wrap gap-2 mt-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
