"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast, useDocumentInfo, useField } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'

interface Option {
  label: string
  value: number
  occupied: boolean
  occupiedBy?: string
}

const buildOptions = (docs: any[], currentId?: string | null): Option[] => {
  // Build a map of sortOrder -> name for showing who occupies each slot
  const occupancyMap = new Map<number, string>()
  for (const doc of docs) {
    if (doc?.id !== currentId && typeof doc?.sortOrder === 'number') {
      occupancyMap.set(doc.sortOrder, doc.name || 'Unnamed')
    }
  }

  // Get max sort order to determine how many slots to show
  const maxPosition = Math.max(0, ...docs.map(doc => Number(doc?.sortOrder) || 0))
  const totalOptions = maxPosition + 1
  const options: Option[] = []

  for (let i = 1; i <= totalOptions; i++) {
    const occupiedBy = occupancyMap.get(i)
    const occupied = !!occupiedBy
    options.push({
      label: occupied ? `${i} (${occupiedBy})` : `${i} (available)`,
      value: i,
      occupied,
      occupiedBy,
    })
  }

  return options
}

const SortOrderSelectRole: FieldClientComponent = ({ path }) => {
  const { value, setValue } = useField<number>({ path: path as string })
  const { id: currentId } = useDocumentInfo()
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSortOrderValue, setLastSortOrderValue] = useState<number | null | undefined>(null)
  const hasShownInitialToast = useRef(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/member-roles?limit=1000&sort=sortOrder', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = await res.json()
        const docs = Array.isArray(data?.docs) ? data.docs : []
        const built = buildOptions(docs, currentId ? String(currentId) : null)
        setOptions(built)

        // Check for duplicates on initial load only (use ref to prevent duplicate toasts)
        if (!hasShownInitialToast.current) {
          const sortOrderMap = new Map<number, string[]>()
          docs.forEach((doc: any) => {
            const sortOrder = Number(doc?.sortOrder)
            if (!Number.isNaN(sortOrder)) {
              if (!sortOrderMap.has(sortOrder)) {
                sortOrderMap.set(sortOrder, [])
              }
              sortOrderMap.get(sortOrder)!.push(doc?.name || 'Unnamed')
            }
          })

          const duplicateList: string[] = []
          sortOrderMap.forEach((names, sortOrder) => {
            if (names.length > 1) {
              duplicateList.push(`Position ${sortOrder}: ${names.join(', ')}`)
            }
          })

          if (duplicateList.length > 0) {
            toast.warning(`You need to change the sort order number for the following:\n${duplicateList.join('\n')}`, {
              duration: 6000,
            })
          }

          hasShownInitialToast.current = true
        }

        // If no value yet, default to first available slot
        if (value === undefined || value === null) {
          const firstAvailable = built.find(opt => !opt.occupied)
          if (firstAvailable) setValue(firstAvailable.value)
        }
      } catch (err) {
        console.error('Failed to load sort order options', err)
        setError('Could not load sort order options. Please reload.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentId, setValue])

  // Monitor for form save and check duplicates after save
  useEffect(() => {
    const currentSortOrderValue = value
    
    // Only trigger post-save check if:
    // 1. The last value was actually set (not null/undefined on initial mount)
    // 2. The value has changed
    if (
      lastSortOrderValue !== null &&
      lastSortOrderValue !== undefined &&
      lastSortOrderValue !== currentSortOrderValue
    ) {
      const checkAfterSave = async () => {
        // Wait for the form to process the save
        await new Promise(resolve => setTimeout(resolve, 800))
        
        try {
          const res = await fetch('/api/member-roles?limit=1000&sort=sortOrder', {
            credentials: 'include',
          })
          if (!res.ok) return

          const data = await res.json()
          const docs = Array.isArray(data?.docs) ? data.docs : []

          const sortOrderMap = new Map<number, string[]>()
          docs.forEach((doc: any) => {
            const sortOrder = Number(doc?.sortOrder)
            if (!Number.isNaN(sortOrder)) {
              if (!sortOrderMap.has(sortOrder)) {
                sortOrderMap.set(sortOrder, [])
              }
              sortOrderMap.get(sortOrder)!.push(doc?.name || 'Unnamed')
            }
          })

          const duplicateList: string[] = []
          sortOrderMap.forEach((names, sortOrder) => {
            if (names.length > 1) {
              duplicateList.push(`Position ${sortOrder}: ${names.join(', ')}`)
            }
          })

          if (duplicateList.length > 0) {
            toast.warning(`You need to change the sort order number for the following:\n${duplicateList.join('\n')}`, {
              duration: 6000,
            })
          }
        } catch (err) {
          console.error('Failed to check duplicates after save', err)
        }
      }

      checkAfterSave()
    }

    setLastSortOrderValue(currentSortOrderValue)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number(e.target.value)
    if (!Number.isNaN(next)) setValue(next)
  }

  const helperText = useMemo(() => {
    if (loading) return 'Loading positions...'
    if (error) return error
    return 'Lower numbers appear first.'
  }, [loading, error])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <select value={value ?? ''} onChange={handleChange} disabled={loading || !!error}>
        <option value="" disabled>
          {loading ? 'Loading...' : 'Select position'}
        </option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <small style={{ color: 'var(--text-subsection)' }}>{helperText}</small>
    </div>
  )
}

export default SortOrderSelectRole
