import type React from 'react'
import { forwardRef } from 'react'

interface ContentPanelProps {
  children?: React.ReactNode
  borderless?: boolean
}

export const ContentPanel = forwardRef<HTMLDivElement, ContentPanelProps>(
  ({ children, borderless }, ref) => {
    return (
      <div
        ref={ref}
        data-scroll-container
        className={`flex-1 overflow-auto relative pt-16 lg:pt-0 ${
          borderless
            ? 'bg-transparent m-0'
            : 'bg-transparent m-0 lg:bg-sidebar lg:m-2 lg:ml-0 lg:rounded-lg lg:border'
        }`}
        style={borderless ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
      >
        {children}
        {borderless && <style jsx>{'div::-webkit-scrollbar { display: none; }'}</style>}
      </div>
    )
  },
)
ContentPanel.displayName = 'ContentPanel'
