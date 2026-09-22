import { createRequire } from 'node:module'
import type { Payload } from 'payload'

const sharp = createRequire(import.meta.url)('sharp')

/**
 * Placeholder images for the demo dataset, drawn at seed time.
 *
 * Nothing binary is committed for this: the images are generated, so the repo
 * stays small and a contributor never wonders whether a photo in their fork is
 * a real member. Each one is labelled with its own dimensions, which makes a
 * wrongly-cropped or wrongly-scaled image obvious at a glance.
 *
 * The shapes on offer are deliberately awkward as well as ordinary - a tall
 * portrait and an ultra-wide banner alongside the usual 16:9 - because a
 * layout that only ever sees well-behaved images hides its bugs.
 */

export type DemoShape = 'landscape' | 'portrait' | 'square' | 'ultrawide' | 'tiny'

const SHAPES: Record<DemoShape, { width: number; height: number }> = {
  landscape: { width: 1200, height: 675 },
  portrait: { width: 720, height: 1280 },
  square: { width: 900, height: 900 },
  ultrawide: { width: 1600, height: 500 },
  // Small enough that any layout upscaling it will look soft - on purpose.
  tiny: { width: 240, height: 180 },
}

/** Distinct hues so two placeholders side by side never look like one image. */
const PALETTE = ['#d98e4a', '#7a5230', '#2f6f6b', '#5c4a72', '#7c3f3f', '#3f5a7c', '#4a6b3f']

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * One labelled placeholder. `seed` picks the colour, so the same subject keeps
 * the same colour across re-runs without the caller tracking an index.
 */
export function demoImageBuffer(label: string, shape: DemoShape, seed: number): Promise<Buffer> {
  const { width, height } = SHAPES[shape]
  const background = PALETTE[seed % PALETTE.length]
  const titleSize = Math.round(Math.min(width, height) / 12)
  const metaSize = Math.round(titleSize * 0.55)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${background}"/>
  <rect x="${width * 0.04}" y="${height * 0.04}" width="${width * 0.92}" height="${height * 0.92}"
        fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="${Math.max(2, width / 300)}"/>
  <text x="50%" y="47%" text-anchor="middle" fill="#ffffff"
        font-family="sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(label)}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.75)"
        font-family="sans-serif" font-size="${metaSize}">${width} x ${height} - demo</text>
</svg>`

  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
}

/**
 * Upload a placeholder and return its media id, reusing the existing document
 * when the seed is run again. Matching is on the filename this function
 * chooses, so a contributor's own uploads are never picked up by mistake.
 */
export async function ensureDemoImage(
  payload: Payload,
  collection: 'media' | 'member-photo' | 'gallery',
  key: string,
  label: string,
  shape: DemoShape,
  seed: number,
  alt: string,
): Promise<number> {
  const name = `demo-${key}.jpg`
  const stem = `demo-${key}`

  const found = await payload.find({
    collection,
    where: { filename: { like: stem } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs.length > 0) return found.docs[0].id as number

  const data = await demoImageBuffer(label, shape, seed)

  // Gallery is an upload collection with a caption rather than an alt.
  const doc = await payload.create({
    collection,
    data: (collection === 'gallery' ? { caption: alt } : { alt }) as never,
    file: { data, name, mimetype: 'image/jpeg', size: data.byteLength },
    overrideAccess: true,
  })
  return doc.id as number
}
