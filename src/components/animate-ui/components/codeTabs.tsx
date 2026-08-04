'use client'

import { CopyButton } from '@/components/features/resources/blocks/copyButton'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

interface CodeTabsProps {
  codes: Record<string, { code: string; language: string; highlightedHtml?: string }>
  className?: string
}

export function CodeTabs({ codes, className }: CodeTabsProps) {
  const tabs = Object.keys(codes)
  const [activeTab, setActiveTab] = useState(tabs[0])

  if (tabs.length === 0) return null

  return (
    <div
      className={cn(
        // Opaque, not `bg-zinc-950/50`: Shiki renders with the `github-dark`
        // theme in both colour modes, and a half-transparent surface let the
        // light-mode page bleed through to a mid grey that the dark syntax
        // colours were unreadable against.
        'group relative my-8 w-full overflow-hidden rounded-xl bg-zinc-950 border border-white/10 shadow-2xl',
        className,
      )}
    >
      {/* Tab Headers */}
      <div className="flex items-center justify-between px-2 bg-white/5 border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative px-4 py-3 text-xs font-medium transition-colors outline-none',
                activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center px-2">
          <CopyButton code={codes[activeTab].code} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[100px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            // rem, not px: a fixed pixel size ignores the reader's OS/browser
            // text-size setting, so code stayed small while surrounding prose
            // scaled up around it.
            className="p-4 overflow-x-auto text-[0.8125rem] leading-relaxed shiki-container"
          >
            {codes[activeTab].highlightedHtml ? (
              // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki-highlighted code generated server-side from CMS content
              <div dangerouslySetInnerHTML={{ __html: codes[activeTab].highlightedHtml }} />
            ) : (
              <pre>
                <code>{codes[activeTab].code}</code>
              </pre>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .shiki-container pre {
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .shiki-container code {
          font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
