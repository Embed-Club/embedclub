'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ArrowUpDown, Calendar, Filter, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Icon-only trailing control that widens on hover/focus/open to reveal its
 * label.
 *
 * The original paired a fixed narrow width with `overflow-visible`, so the
 * label rendered *outside* its button and overlapped its neighbours — worst on
 * pages with fewer controls (e.g. simulators, which has no category filter).
 *
 * Two things collapse together: the button's width, and the label's own
 * max-width (see below). Clipping alone was not enough, because
 * `overflow-hidden` clips at the border box, so the button's right padding hid
 * nothing and a sliver of text stayed visible.
 *
 * `[&>svg:last-child]:hidden` drops the ChevronDown that shadcn's
 * `SelectTrigger` always appends — no room for it beside an icon and a label,
 * and the icon already carries the meaning. It only matches the Select
 * triggers; on the Date buttons the last child is the label span.
 */
const searchControlClassName = cn(
  'group/ctl flex h-full w-10 shrink-0 items-center justify-center gap-0 overflow-hidden whitespace-nowrap rounded-none border-0 bg-transparent px-3 text-sm shadow-none outline-none',
  'transition-[width,background-color] duration-200 ease-out',
  'hover:w-24 focus-visible:w-24 data-[state=open]:w-24',
  'hover:bg-foreground/5 focus-visible:z-10 focus-visible:bg-foreground/5 data-[state=open]:bg-foreground/5',
  '[&>svg:last-child]:hidden',
)

/**
 * The label collapses to zero width of its own accord, rather than relying on
 * the button being narrow enough to clip it. `overflow-hidden` clips at the
 * border box, so right padding hides nothing — a label positioned past the
 * icon still peeked out of the collapsed button. Its left gap lives in `pl`
 * here (not `gap` on the button) so that it too disappears at zero width,
 * leaving the collapsed button exactly icon-sized.
 */
const searchControlLabelClassName = cn(
  'max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0',
  'transition-[max-width,opacity,padding] duration-200 ease-out',
  'group-hover/ctl:max-w-[4rem] group-hover/ctl:pl-1.5 group-hover/ctl:opacity-100',
  'group-focus-visible/ctl:max-w-[4rem] group-focus-visible/ctl:pl-1.5 group-focus-visible/ctl:opacity-100',
  'group-data-[state=open]/ctl:max-w-[4rem] group-data-[state=open]/ctl:pl-1.5 group-data-[state=open]/ctl:opacity-100',
)

const searchBarStyles = `
@keyframes placeholder-slide-up {
  0% {
    transform: translateY(0);
    opacity: 1;
    filter: blur(0px);
  }
  100% {
    transform: translateY(-50%);
    opacity: 0;
    filter: blur(3px);
  }
}

@keyframes placeholder-slide-in {
  0% {
    transform: translateY(50%);
    opacity: 0;
    filter: blur(3px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
    filter: blur(0px);
  }
}
`

type SearchBarProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'defaultValue'
> & {
  placeholders?: string[]
  interval?: number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit?: (value: string) => void
  icon?: React.ReactNode
  className?: string
  inputClassName?: string
  /** Omit (or pass an empty list) to hide the category filter entirely. */
  categories?: string[]
  selectedCategory?: string | 'all'
  onCategoryChange?: (category: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  activeTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void
}

export function SearchBar({
  placeholders = ['Search...', 'Type something...', 'What are you looking for?'],
  interval = 3000,
  onChange,
  onSubmit,
  icon,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  sortBy,
  onSortChange,
  activeTags,
  selectedTags,
  onTagsChange,
  onDateRangeChange,
  className = '',
  inputClassName = '',
  ...props
}: SearchBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [_isFocused, setIsFocused] = useState(false)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (inputValue) return

    const timer = window.setInterval(() => {
      setIsAnimating(true)
      window.setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % placeholders.length)
        setIsAnimating(false)
      }, 300)
    }, interval)

    return () => window.clearInterval(timer)
  }, [placeholders.length, interval, inputValue])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleApplyDateRange = () => {
    onDateRangeChange({
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    })
  }

  const handleClearDateRange = () => {
    setDateFrom('')
    setDateTo('')
    onDateRangeChange({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Detect #tag in search box
    if (value.includes('#')) {
      const words = value.split(' ')
      const tagWord = words.find((w) => w.startsWith('#') && w.length > 1)
      if (tagWord) {
        const tag = tagWord.slice(1)
        if (activeTags.includes(tag) && !selectedTags.includes(tag)) {
          onTagsChange([...selectedTags, tag])
          const newValue = value.replace(tagWord, '').trim()
          setInputValue(newValue)
          onChange?.({
            ...e,
            target: { ...e.target, value: newValue },
            // biome-ignore lint/suspicious/noExplicitAny: synthetic passthrough of the original change event with a rewritten value
          } as any)
          return
        }
      }
    }
    onChange?.(e)
  }

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault()
    onSubmit?.(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <>
      <style>{searchBarStyles}</style>
      <div className={`flex flex-col w-full max-w-xl gap-3 ${className}`}>
        <form onSubmit={handleSubmit} className="relative w-full">
          <div
            className={`
              relative flex items-center w-full px-1
              bg-white/3 backdrop-blur-2xl
              border border-white/8
              rounded-full
              transition-all duration-300 ease-out
              hover:border-white/12 hover:bg-white/4
              focus-within:border-white/12 focus-within:bg-white/4
              shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]
            `}
          >
            <div className="flex items-center justify-center w-12 h-12 text-zinc-500">
              {icon || (
                <svg
                  role="img"
                  aria-label="Search"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </div>

            <div className="relative flex-1 h-12">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                className={`
                  w-full h-full bg-transparent
                  text-zinc-200 text-[15px]
                  outline-none
                  placeholder-transparent
                  pr-4
                  ${inputClassName}
                `}
                {...props}
              />

              {!inputValue && (
                <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
                  <span
                    className="text-zinc-500 text-[15px] transition-all duration-300 ease-in-out"
                    style={{
                      animation: isAnimating
                        ? 'placeholder-slide-up 0.3s ease-in-out forwards'
                        : 'placeholder-slide-in 0.3s ease-in-out forwards',
                    }}
                  >
                    {placeholders[currentIndex]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0 h-12">
              {/* Collections without categories (e.g. simulators) skip this control */}
              {categories.length > 0 && onCategoryChange ? (
                <>
                  <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className={searchControlClassName}>
                      <Filter className="h-4 w-4 flex-shrink-0" />
                      <span className={searchControlLabelClassName}>Filter</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="h-8 border-l border-white/10" />
                </>
              ) : null}

              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className={searchControlClassName}>
                  <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
                  <span className={searchControlLabelClassName}>Sort</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevant">Most Relevant</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="newest">Recently Added</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-8 border-l border-white/10" />

              {isDesktop ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(searchControlClassName, 'rounded-r-full pr-4 -mr-1')}
                    >
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className={searchControlLabelClassName}>Date</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 p-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none text-zinc-100">Date Range</h4>
                        <p className="text-sm text-zinc-400">Filter resources by date.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label htmlFor="from" className="text-sm text-zinc-300">
                            From
                          </label>
                          <input
                            id="from"
                            type="date"
                            className="col-span-2 h-8 rounded-md bg-zinc-800 border-zinc-700 text-zinc-200 px-2 text-xs"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label htmlFor="to" className="text-sm text-zinc-300">
                            To
                          </label>
                          <input
                            id="to"
                            type="date"
                            className="col-span-2 h-8 rounded-md bg-zinc-800 border-zinc-700 text-zinc-200 px-2 text-xs"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearDateRange}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                        <Button size="sm" onClick={handleApplyDateRange} className="text-xs">
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className={cn(searchControlClassName, 'rounded-r-full pr-4 -mr-1')}
                    >
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className={searchControlLabelClassName}>Date</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                      <DialogTitle>Select Date Range</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="from-mobile" className="text-sm font-medium">
                          From Date
                        </label>
                        <input
                          id="from-mobile"
                          type="date"
                          className="w-full h-12 rounded-lg bg-zinc-800 border-zinc-700 text-zinc-100 px-4"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="to-mobile" className="text-sm font-medium">
                          To Date
                        </label>
                        <input
                          id="to-mobile"
                          type="date"
                          className="w-full h-12 rounded-lg bg-zinc-800 border-zinc-700 text-zinc-100 px-4"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="ghost"
                        className="flex-1 h-12"
                        onClick={handleClearDateRange}
                      >
                        Clear
                      </Button>
                      <Button className="flex-1 h-12" onClick={handleApplyDateRange}>
                        Apply Filter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </form>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs bg-primary/15 text-primary border border-primary/25 rounded-full hover:bg-primary/25 transition-colors animate-in fade-in zoom-in duration-200"
              >
                {tag}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => onTagsChange([])}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  )
}

type SearchBarMinimalProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'defaultValue'
> & {
  placeholders?: string[]
  interval?: number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit?: (value: string) => void
  className?: string
}

export function SearchBarMinimal({
  placeholders = ['Search...', 'Type something...', 'What are you looking for?'],
  interval = 3000,
  onChange,
  onSubmit,
  className = '',
  ...props
}: SearchBarMinimalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (inputValue || isFocused) return

    const timer = window.setInterval(() => {
      setIsAnimating(true)
      window.setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % placeholders.length)
        setIsAnimating(false)
      }, 300)
    }, interval)

    return () => window.clearInterval(timer)
  }, [placeholders.length, interval, inputValue, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange?.(e)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit?.(inputValue)
  }

  return (
    <>
      <style>{searchBarStyles}</style>
      <form onSubmit={handleSubmit} className={`relative w-full max-w-md ${className}`}>
        <div
          className={`
            relative flex items-center w-full h-11
            bg-zinc-950
            border border-zinc-800
            rounded-lg
            transition-all duration-200
            hover:border-zinc-700
            focus-within:border-zinc-600
            focus-within:ring-2 focus-within:ring-zinc-800
          `}
        >
          <div className="flex items-center justify-center w-10 text-zinc-600">
            <svg
              role="img"
              aria-label="Search"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <div className="relative flex-1 h-full">
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full h-full bg-transparent text-zinc-300 text-sm outline-none placeholder-transparent pr-3"
              {...props}
            />

            {!inputValue && (
              <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
                <span
                  className="text-zinc-600 text-sm transition-all duration-300 ease-in-out"
                  style={{
                    animation: isAnimating
                      ? 'placeholder-slide-up 0.3s ease-in-out forwards'
                      : 'placeholder-slide-in 0.3s ease-in-out forwards',
                  }}
                >
                  {placeholders[currentIndex]}
                </span>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
