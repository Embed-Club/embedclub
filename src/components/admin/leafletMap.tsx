'use client'

import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface ClickHandlerProps {
  onSelect: (coords: { lat: number; lng: number }) => void
  setInternalMarker: (coords: { lat: number; lng: number }) => void
}

function ClickHandler({ onSelect, setInternalMarker }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng }
      setInternalMarker(coords)
      onSelect(coords)
    },
  })
  return null
}

// Leaflet inside a tab/flex container often mounts at 0px and renders grey —
// force it to recompute size once it's laid out.
function SizeFixer() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

// Real <button> zoom controls. Leaflet's built-in zoom control is an <a href="#">,
// and inside the Payload admin a hash click reads as a route change and fires
// the "leave without saving" guard. Buttons never navigate.
function ZoomButtons() {
  const map = useMap()
  const containerRef = useRef<HTMLDivElement>(null)

  // The buttons live in a React-rendered .leaflet-control div, which Leaflet
  // did NOT register — so their clicks bubble to the map and drop a pin behind
  // the zoom. Disable click/scroll propagation on the container to stop that.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    L.DomEvent.disableClickPropagation(el)
    L.DomEvent.disableScrollPropagation(el)
  }, [])

  const btnStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: '#fff',
    color: '#000',
    fontSize: '18px',
    lineHeight: '1',
    cursor: 'pointer',
  }
  return (
    <div className="leaflet-top leaflet-left" style={{ pointerEvents: 'auto' }}>
      <div
        ref={containerRef}
        className="leaflet-control leaflet-bar"
        style={{ margin: '10px', overflow: 'hidden', borderRadius: '4px' }}
      >
        <button type="button" style={btnStyle} aria-label="Zoom in" onClick={() => map.zoomIn()}>
          +
        </button>
        <button
          type="button"
          style={{ ...btnStyle, borderTop: '1px solid #ccc' }}
          aria-label="Zoom out"
          onClick={() => map.zoomOut()}
        >
          −
        </button>
      </div>
    </div>
  )
}

function MapUpdater({
  lat,
  lng,
  zoom,
  setInternalMarker,
}: {
  lat?: number
  lng?: number
  zoom?: number
  setInternalMarker: (coords: { lat: number; lng: number }) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      setInternalMarker({ lat, lng })
      setTimeout(() => {
        map.invalidateSize()
        map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 1.0 })
      }, 220)
    }
  }, [lat, lng, zoom, map, setInternalMarker])

  return null
}

interface LeafletMapProps {
  lat?: number
  lng?: number
  zoom?: number
  readonly?: boolean
  onChange: (coords: { lat: number; lng: number }) => void
}

export default function LeafletMap({
  lat,
  lng,
  zoom,
  onChange,
  readonly = false,
}: LeafletMapProps) {
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null)
  const safeZoom =
    typeof zoom === 'number' && !Number.isNaN(zoom) ? Math.min(Math.max(zoom, 3), 18) : 15

  useEffect(() => {
    // react-leaflet + bundlers break Leaflet's default icon path detection.
    // The override must be DELETED (not set to undefined) so Leaflet falls back
    // to reading options.iconUrl — assigning undefined shadows the base method
    // and crashes with "this._getIconUrl is not a function" in production.
    // biome-ignore lint/suspicious/noExplicitAny: Leaflet internals
    // biome-ignore lint/performance/noDelete: MUST be delete — assigning undefined shadows the base method and crashes Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  useEffect(() => {
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      setMarkerPos({ lat, lng })
    }
  }, [lat, lng])

  // PA College of Engineering coordinates as default
  const defaultPosition: [number, number] = [12.808128, 74.933174]
  const position: [number, number] =
    typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? [lat, lng]
      : defaultPosition

  const hasValidMarker =
    markerPos &&
    typeof markerPos.lat === 'number' &&
    typeof markerPos.lng === 'number' &&
    !Number.isNaN(markerPos.lat) &&
    !Number.isNaN(markerPos.lng)

  return (
    <div
      style={{
        height: '320px',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={position}
        zoom={safeZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SizeFixer />
        {!readonly && <ZoomButtons />}
        {!readonly && onChange && (
          <ClickHandler onSelect={onChange} setInternalMarker={setMarkerPos} />
        )}
        <MapUpdater lat={lat} lng={lng} zoom={safeZoom} setInternalMarker={setMarkerPos} />
        {hasValidMarker && (
          <Marker
            position={[markerPos.lat, markerPos.lng]}
            draggable={!readonly}
            eventHandlers={{
              dragend(e) {
                const m = e.target as L.Marker
                const p = m.getLatLng()
                const coords = { lat: p.lat, lng: p.lng }
                setMarkerPos(coords)
                if (!readonly) onChange(coords)
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
