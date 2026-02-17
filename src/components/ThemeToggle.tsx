"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  FlipButton,
  FlipButtonBack,
  FlipButtonFront,
} from '@/components/animate-ui/components/buttons/flip'


export function ModeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button>
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <FlipButton 
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      from="bottom"
    >
      <FlipButtonFront >
        {isDark ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
      </FlipButtonFront>
      <FlipButtonBack>
        {isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
      </FlipButtonBack>
    </FlipButton>
  )
}
