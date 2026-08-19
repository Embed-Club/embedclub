import { ImageResponse } from 'next/og'

export const alt = 'Embed Club - embedded systems & IoT club at PA College of Engineering'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Branded default social-share card (Solder & Copper theme). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'radial-gradient(ellipse at bottom, #262626 0%, #0a0a0a 100%)',
        color: '#f5f5f5',
      }}
    >
      <div style={{ display: 'flex', fontSize: 40, letterSpacing: 12, color: '#d98e4a' }}>
        EMBED CLUB
      </div>
      <div
        style={{ display: 'flex', marginTop: 24, fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}
      >
        Unlocking the Power of
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1.05,
          color: '#d98e4a',
        }}
      >
        IoT &amp; Embedded Systems
      </div>
      <div style={{ display: 'flex', marginTop: 40, fontSize: 32, color: '#a3a3a3' }}>
        PA College of Engineering, Mangalore
      </div>
    </div>,
    { ...size },
  )
}
