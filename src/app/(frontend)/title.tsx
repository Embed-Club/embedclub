'use client'
import DecryptedTextProps from '@/components/common/decryptedText'

export default function DashboardTitle() {
  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <div className="text-2xl md:text-3xl lg:text-4xl font-light mb-4">ELCOE TO</div>
      <div className="text-5xl md:text-6xl lg:text-7xl font-bold">
        <DecryptedTextProps
          text="EBED CLUB"
          sequential={true}
          speed={70}
          maxIterations={10}
          animateOn="view"
        />
      </div>
    </div>
  )
}
