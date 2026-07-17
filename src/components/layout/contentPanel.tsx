import type React from 'react'
import { forwardRef } from 'react'

interface ContentPanelProps {
  children?: React.ReactNode
  borderless?: boolean
  /** Hide the scrollbar chrome while keeping the panel scrollable (e.g. home). */
  hideScrollbar?: boolean
}

export const ContentPanel = forwardRef<HTMLDivElement, ContentPanelProps>(
  ({ children, borderless, hideScrollbar }, ref) => {
    const noScrollbar = borderless || hideScrollbar
    return (
      <div
        ref={ref}
        data-scroll-container
        className={`flex-1 overflow-auto relative pt-16 lg:pt-0 texture-panel ${
          borderless
            ? 'bg-background m-0'
            : 'bg-background m-0 lg:bg-sidebar lg:m-2 lg:ml-0 lg:rounded-lg lg:border'
        }`}
        style={noScrollbar ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
      >
        {children}
        {noScrollbar && <style jsx>{'div::-webkit-scrollbar { display: none; }'}</style>}
      </div>
    )
  },
)
ContentPanel.displayName = 'ContentPanel'
