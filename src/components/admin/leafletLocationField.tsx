'use client'

import { useField } from '@payloadcms/ui'
import dynamic from 'next/dynamic'
import type { FieldClientComponent } from 'payload'
import type React from 'react'
import { Suspense, useEffect, useRef, useState } from 'react'

// Import with ssr: false to prevent server-side rendering of Leaflet
const LeafletMap = dynamic(() => import('./leafletMap'), { ssr: false })

const LeafletLocationField: FieldClientComponent = (props) => {
  const { path } = props

  // Use individual field hooks for lat and lng instead of the group value
  const { value: latValue, setValue: setLatValue } = useField<number | null>({
    path: `${path}.lat`,
  })
  const { value: lngValue, setValue: setLngValue } = useField<number | null>({
    path: `${path}.lng`,
  })

  const [localLat, setLocalLat] = useState<string>('')
  const [localLng, setLocalLng] = useState<string>('')
  const isUpdatingFromMap = useRef(false)

  // Sync local state with form values
  useEffect(() => {
    if (!isUpdatingFromMap.current) {
      if (latValue !== undefined && latValue !== null) {
        setLocalLat(latValue.toString())
      } else {
        setLocalLat('')
      }

      if (lngValue !== undefined && lngValue !== null) {
        setLocalLng(lngValue.toString())
      } else {
        setLocalLng('')
      }
    }
    isUpdatingFromMap.current = false
  }, [latValue, lngValue])

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    isUpdatingFromMap.current = true
    setLocalLat(coords.lat.toString())
    setLocalLng(coords.lng.toString())
    setLatValue(coords.lat)
    setLngValue(coords.lng)
  }

  /** "12.806869, 74.932505" pasted into either box fills both fields. */
  const applyCombined = (raw: string): boolean => {
    const match = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/)
    if (!match) return false
    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])
    if (Number.isNaN(lat) || Number.isNaN(lng)) return false
    isUpdatingFromMap.current = true
    setLocalLat(String(lat))
    setLocalLng(String(lng))
    setLatValue(lat)
    setLngValue(lng)
    return true
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (applyCombined(text)) e.preventDefault()
  }

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (applyCombined(val)) return
    setLocalLat(val)
    const lat = val ? Number.parseFloat(val) : null
    if (lat === null || !Number.isNaN(lat)) setLatValue(lat)
  }

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (applyCombined(val)) return
    setLocalLng(val)
    const lng = val ? Number.parseFloat(val) : null
    if (lng === null || !Number.isNaN(lng)) setLngValue(lng)
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <strong>Click on the map to set location, or enter coordinates manually:</strong>
      </div>

      {/* Manual Input Fields */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor={`${path}-lat`}
            style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}
          >
            Latitude
          </label>
          <input
            id={`${path}-lat`}
            type="text"
            inputMode="decimal"
            value={localLat}
            onChange={handleLatChange}
            onPaste={handlePaste}
            placeholder='e.g., 12.806922 — or paste "lat, lng" together'
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor={`${path}-lng`}
            style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}
          >
            Longitude
          </label>
          <input
            id={`${path}-lng`}
            type="text"
            inputMode="decimal"
            value={localLng}
            onChange={handleLngChange}
            onPaste={handlePaste}
            placeholder='e.g., 74.932009 — or paste "lat, lng" together'
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Click on map to set marker:</strong>
      </div>
      <Suspense
        fallback={
          <div
            style={{
              height: '600px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Loading map...
          </div>
        }
      >
        <LeafletMap
          lat={typeof latValue === 'number' ? latValue : undefined}
          lng={typeof lngValue === 'number' ? lngValue : undefined}
          onChange={handleMapClick}
        />
      </Suspense>

      {/* Current Coordinates Display */}
      {typeof latValue === 'number' && typeof lngValue === 'number' && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          <strong>Current Location:</strong> {latValue.toFixed(6)}, {lngValue.toFixed(6)}
        </div>
      )}
    </div>
  )
}

export default LeafletLocationField
