import { PanelTexture } from '@/components/ui/bg-image-texture'
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
        className={`flex-1 overflow-auto relative ${
          borderless
            ? 'bg-transparent m-0'
            : 'bg-transparent m-0 lg:bg-sidebar lg:m-2 lg:ml-0 lg:rounded-lg lg:border'
        }`}
        style={borderless ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
      >
        {/* relative wrapper spans the full scrollable content so the texture covers it
            all; it also carries the mobile top padding so absolutely-positioned page
            titles keep the same anchor as before */}
        <div className="relative min-h-full pt-16 lg:pt-0 rounded-[inherit]">
          <PanelTexture />
          {children}
        </div>
        {borderless && <style jsx>{'div::-webkit-scrollbar { display: none; }'}</style>}
      </div>
    )
  },
)
ContentPanel.displayName = 'ContentPanel'
