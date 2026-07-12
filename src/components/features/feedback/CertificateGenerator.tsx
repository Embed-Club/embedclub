'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface CertificateGeneratorProps {
  templateUrl: string
  config: {
    nameX: number
    nameY: number
    fontSize: number
    color: string
  }
  defaultName?: string
}

export function CertificateGenerator({
  templateUrl,
  config,
  defaultName = '',
}: CertificateGeneratorProps) {
  const [name, setName] = useState(defaultName)
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    if (!name.trim()) {
      alert('Please enter your name for the certificate')
      return
    }

    setGenerating(true)
    try {
      // pdf-lib is only needed on click — dynamic import keeps it out of the page bundle
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

      // Fetch the template
      const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer())

      // Load the PDF
      const pdfDoc = await PDFDocument.load(templateBytes)
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]

      // Load a font
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
          ? {
              r: Number.parseInt(result[1], 16) / 255,
              g: Number.parseInt(result[2], 16) / 255,
              b: Number.parseInt(result[3], 16) / 255,
            }
          : { r: 0, g: 0, b: 0 }
      }

      const color = hexToRgb(config.color)

      // Draw the name
      firstPage.drawText(name, {
        x: config.nameX,
        y: config.nameY,
        size: config.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      })

      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save()

      // Download it
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `EmbedClub_Certificate_${name.replace(/\s+/g, '_')}.pdf`
      link.click()
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mt-12 p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm max-w-xl mx-auto text-center space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">Claim Your Certificate</h3>
        <p className="text-sm text-zinc-400">
          Once you&apos;ve submitted the form, enter your name below to download your certificate.
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
        />

        <Button
          onClick={generatePDF}
          disabled={generating || !name.trim()}
          className="w-full h-12 rounded-xl text-base font-semibold group"
        >
          {generating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Download className="mr-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
          )}
          {generating ? 'Generating...' : 'Download PDF Certificate'}
        </Button>
      </div>
    </div>
  )
}
