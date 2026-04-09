'use client'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ArrowUpDown, Filter } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

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
  categories: string[]
  selectedCategory: string | 'all'
  onCategoryChange: (category: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export function SearchBar({
  placeholders = ['Search...', 'Type something...', 'What are you looking for?'],
  interval = 3000,
  onChange,
  onSubmit,
  icon,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  className = '',
  inputClassName = '',
  ...props
}: SearchBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [_isFocused, setIsFocused] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
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

  const _handleClear = () => {
    setInputValue('')
    inputRef.current?.focus()
  }

  return (
    <>
      <style>{searchBarStyles}</style>
      <form onSubmit={handleSubmit} className={`relative w-full max-w-lg ${className}`}>
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
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="group flex items-center justify-center w-8 h-full gap-1 overflow-visible rounded-none shadow-none transition-all duration-200 hover:w-24 data-[state=open]:w-24 border-0 bg-transparent hover:bg-white/2 data-[state=open]:bg-white/2 focus-visible:z-10">
                <Filter className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Filter</span>
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

            <div className="h-8 border-l border-white-800" />

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="group flex items-center justify-center w-10 h-full gap-1 overflow-visible rounded-none shadow-none transition-all duration-200 hover:w-24 data-[state=open]:w-24 border-0 bg-transparent hover:bg-white/2 data-[state=open]:bg-white/2 focus-visible:z-10 rounded-r-full pr-3">
                <span className="whitespace-nowrap">Sort</span>
                <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
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
