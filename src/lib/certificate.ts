import 'server-only'

export interface CertificateConfig {
  nameX: number
  nameY: number
  fontSize: number
  color: string
}

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  nameX: 400,
  nameY: 300,
  fontSize: 40,
  color: '#000000',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16) / 255,
        g: Number.parseInt(result[2], 16) / 255,
        b: Number.parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * Render a certificate PDF with the recipient's name drawn onto the template.
 *
 * Deliberately mirrors `certificateGenerator.tsx` — the browser path (used for
 * the "download it now" flow) and this server path (used for emailing) must
 * produce the same document, so they share the same config fields and the same
 * placement maths. pdf-lib is imported lazily to keep it out of cold starts
 * that never touch certificates.
 *
 * The template may be a PDF or a PNG/JPEG; an image is placed on a new page
 * sized to the image so coordinates behave the same either way.
 */
export async function renderCertificate(
  templateUrl: string,
  name: string,
  config: CertificateConfig,
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

  const res = await fetch(templateUrl)
  if (!res.ok) {
    throw new Error(`Certificate template fetch failed (${res.status}) for ${templateUrl}`)
  }
  const templateBytes = new Uint8Array(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? ''

  let pdfDoc: Awaited<ReturnType<typeof PDFDocument.create>>
  let page: ReturnType<typeof pdfDoc.addPage>

  if (contentType.includes('pdf') || templateUrl.toLowerCase().endsWith('.pdf')) {
    pdfDoc = await PDFDocument.load(templateBytes)
    page = pdfDoc.getPages()[0]
  } else {
    pdfDoc = await PDFDocument.create()
    const image = contentType.includes('png')
      ? await pdfDoc.embedPng(templateBytes)
      : await pdfDoc.embedJpg(templateBytes)
    page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const color = hexToRgb(config.color)

  page.drawText(name, {
    x: config.nameX,
    y: config.nameY,
    size: config.fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  })

  return pdfDoc.save()
}

export function certificateFileName(name: string): string {
  const safe = name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'Certificate'
  return `EmbedClub_Certificate_${safe}.pdf`
}
