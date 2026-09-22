/**
 * Regenerate the favicon set from the club logo.
 *
 *   node scripts/buildFavicons.mjs
 *
 * The mark is white and grey, so on its own it disappears against a light
 * surface (a browser tab strip, Google's light results card) and its darker
 * grey disappears against a dark one. Every icon here is therefore drawn on
 * the theme's graphite background, which is how the logo appears on the site
 * itself. Artwork is untouched - only the backing is added.
 *
 * Re-run after changing public/embedClubLogo-Dark.svg and commit the output.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const sharp = createRequire(import.meta.url)('sharp')

/** `--background` in the dark theme (globals.css): hsl(20 14.3% 4.1%). */
const GRAPHITE = '#0c0a09'
const SOURCE = 'public/embedClubLogo-Dark.svg'
/** Inset so the mark is not clipped when a platform rounds the corners. */
const PADDING = 0.1

const logo = readFileSync(SOURCE)

async function render(size) {
  // sharp honours only the last resize in a pipeline, so the inset is worked
  // out up front and the edges are padded to land exactly on `size`.
  const edge = Math.round(size * PADDING)
  const inner = size - edge * 2
  return sharp(logo, { density: 1024 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: edge, bottom: edge, left: edge, right: edge, background: GRAPHITE })
    .flatten({ background: GRAPHITE })
    .png()
    .toBuffer()
}

/** ICO container: 6-byte header, a 16-byte entry per size, then PNG payloads. */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size === 256 ? 0 : size, 0)
    entry.writeUInt8(size === 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const icoSizes = [16, 32, 48]
const images = []
for (const size of icoSizes) {
  images.push({ size, data: await render(size) })
}
writeFileSync('public/favicon.ico', ico(images))

// Google wants a square favicon that is a multiple of 48; Apple wants an
// opaque 180px PNG and ignores SVG entirely.
writeFileSync('public/icon192.png', await render(192))
writeFileSync('public/icon512.png', await render(512))
writeFileSync('public/appleTouchIcon.png', await render(180))

// The vector copy browsers prefer, with the same backing painted behind it.
const svg = readFileSync(SOURCE, 'utf8').replace(
  /(<svg[^>]*>)/,
  `$1<rect width="500" height="500" fill="${GRAPHITE}"/>`,
)
writeFileSync('src/app/icon.svg', svg)

console.log('favicon.ico, icon192.png, icon512.png, appleTouchIcon.png, src/app/icon.svg')
