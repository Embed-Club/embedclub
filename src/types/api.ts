/**
 * Unified API and data-fetching type definitions
 * Used across pages that fetch from Payload CMS and other API endpoints
 */

/**
 * State tracking for graceful error handling
 * Used when database or API becomes unavailable
 */
export interface FallbackState {
  useFallback: boolean
  error?: Error | null
  message?: string
}

/**
 * Empty state configuration for consistent messaging
 * Displayed when data fetch returns zero items
 */
export interface EmptyStateConfig {
  title: string
  subtitle: string
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Generic card data structure for list views
 * Extended by specific card types (EventCard, ResourceCard, SimulatorCard, etc.)
 */
export interface CardData {
  id: string
  title: string
  description?: string
  image?: string
  slug?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

/**
 * Event card data structure
 * Used in /events and events carousel/grid
 */
export interface EventCardData extends CardData {
  date?: string
  location?: string
  category?: string
  isFallback?: boolean
}

/**
 * Resource card data structure
 * Used in /resources and resource search/filter
 */
export interface ResourceCardData extends CardData {
  tags?: string[]
  difficulty?: string
  category?: string
  lastUpdated?: string
  estimatedTime?: number
  isFallback?: boolean
}

/**
 * Gallery item data structure
 * Used in /gallery masonry layout
 */
export interface GalleryItemData {
  id: string
  img: string
  url: string
  height: number
  width: number
}

/**
 * Common API error response
 * Standardized error handling from Payload and fetch endpoints
 */
export interface ApiErrorResponse {
  error: {
    name: string
    message: string
    status?: number
  }
}

/**
 * Payload API pagination response wrapper
 * Standard format returned by Payload API endpoints
 */
export interface PayloadPaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number | null
  nextPage?: number | null
}

/**
 * Fetch options with error handling
 * Used for consistent retry and error logging
 */
export interface FetchOptions extends RequestInit {
  retries?: number
  timeout?: number
}
