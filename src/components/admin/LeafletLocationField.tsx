"use client";

import { useField } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'
import React, { useEffect, useState, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Import with ssr: false to prevent server-side rendering of Leaflet
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

interface CoordinateValue {
  lat?: number | null
  lng?: number | null
}

const LeafletLocationField: FieldClientComponent = (props) => {
  const { path } = props
  
  // Use individual field hooks for lat and lng instead of the group value
  const { value: latValue, setValue: setLatValue } = useField<number | null>({ path: `${path}.lat` })
  const { value: lngValue, setValue: setLngValue } = useField<number | null>({ path: `${path}.lng` })
  
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
    
    console.log('Setting coordinates from map:', coords)
    setLatValue(coords.lat)
    setLngValue(coords.lng)
  }

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalLat(val)
    const lat = val ? parseFloat(val) : null
    
    if (lat === null || !isNaN(lat)) {
      console.log('Setting lat from input:', lat)
      setLatValue(lat)
    }
  }

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalLng(val)
    const lng = val ? parseFloat(val) : null
    
    if (lng === null || !isNaN(lng)) {
      console.log('Setting lng from input:', lng)
      setLngValue(lng)
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <strong>Click on the map to set location, or enter coordinates manually:</strong>
      </div>

      {/* Manual Input Fields */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={localLat}
            onChange={handleLatChange}
            placeholder="e.g., 12.806922"
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
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={localLng}
            onChange={handleLngChange}
            placeholder="e.g., 74.932009"
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
      <Suspense fallback={<div style={{ height: '600px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>}>
        <LeafletMap
          lat={typeof latValue === 'number' ? latValue : undefined}
          lng={typeof lngValue === 'number' ? lngValue : undefined}
          onChange={handleMapClick}
        />
      </Suspense>

      {/* Current Coordinates Display */}
      {typeof latValue === 'number' && typeof lngValue === 'number' && (
        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
          <strong>Current Location:</strong> {latValue.toFixed(6)}, {lngValue.toFixed(6)}
        </div>
      )}
    </div>
  )
}

export default LeafletLocationField
