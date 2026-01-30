import React from "react"

interface ContentPanelProps {
  children?: React.ReactNode
  borderless?: boolean
}

export function ContentPanel({ children, borderless }: ContentPanelProps) {
  return (
    <div 
      className={`flex-1 overflow-auto relative pt-16 lg:pt-0 ${!borderless ? 'bg-sidebar m-2 ml-0 rounded-lg' : 'bg-transparent m-0'}`}
      style={borderless ? {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } : undefined}
    >
      {children}
      {borderless && (
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      )}
    </div>
  )
}
