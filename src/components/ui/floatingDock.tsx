'use client'
/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import { cn } from '@/lib/utils'
import { PanelBottomClose } from 'lucide-react'
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import type React from 'react'
import { useRef, useState } from 'react'

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[]
  desktopClassName?: string
  mobileClassName?: string
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  )
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[]
  className?: string
}) => {
  const [open, setOpen] = useState(false)
  return (
    <div
      id="embedthon-floating-dock-mobile"
      className={cn('relative block md:hidden transition-all duration-300', className)}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <a
                  href={item.href}
                  key={item.title}
                  data-dock-icon="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-300 shadow-md"
                >
                  <div className="h-4 w-4 dock-icon-wrapper flex items-center justify-center text-inherit">
                    {item.icon}
                  </div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="floating-dock-toggle flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors duration-300 shadow-lg"
      >
        <PanelBottomClose className="h-5 w-5 text-inherit transition-colors duration-300" />
      </button>
    </div>
  )
}

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[]
  className?: string
}) => {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)
  return (
    <motion.div
      id="embedthon-floating-dock"
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
      className={cn(
        'floating-dock-desktop mx-auto hidden h-16 items-end gap-4 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-colors duration-300 px-4 pb-3 md:flex',
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  )
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: MotionValue
  title: string
  icon: React.ReactNode
  href: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }

    return (val as number) - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40])
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40])

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20])
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20])

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const [hovered, setHovered] = useState(false)

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-dock-icon="true"
        className="floating-dock-item relative flex aspect-square items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-300"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 2, x: '-50%' }}
              className="floating-dock-tooltip absolute -top-8 left-1/2 w-fit rounded-md border border-border bg-popover px-2 py-0.5 text-xs whitespace-pre text-popover-foreground shadow-md pointer-events-none"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="dock-icon-wrapper flex items-center justify-center text-inherit transition-colors duration-300"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  )
}
