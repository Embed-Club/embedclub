import { createContext } from 'react'

/** The scrolling content panel element, shared so descendants (e.g. the site
 *  footer's scroll-snap) can drive it. Kept in its own module so components
 *  can consume it without importing the shell (avoids an import cycle). */
export const ScrollContainerContext = createContext<HTMLDivElement | null>(null)
