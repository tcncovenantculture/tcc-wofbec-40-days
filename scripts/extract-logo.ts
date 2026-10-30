// Cuts the Covenant Culture logo out of a flat image on a white background (the 1080px social graphic)
// and writes transparent web assets. A stopgap until the original logo files (SVG or large PNG) arrive.
//
//   node scripts/extract-logo.ts docs/brand/covenant-culture-source.png
//
// Writes src/assets/brand/logo.webp (mark + wordmark), src/assets/brand/logo-mark.webp (mark only) and
// public/icon-source.png (square icon source for `pnpm icons`).
import sharp from 'sharp'

const source = process.argv[2]
if (!source) {
  console.error('Usage: node scripts/extract-logo.ts <image>')
  process.exit(1)
}

// The graphic's background is 254, not pure white. Anything this light or lighter becomes transparent.
const WHITE = 254
// A pixel counts as "logo" when it's at least this much darker than the background
const INK_THRESHOLD = 30
// The decorative wave starts below this fraction of the image height
const LOGO_AREA = 0.72
const PADDING = 4
// The source has faint compression noise around the logo; alpha below this is treated as background
const NOISE_FLOOR = 12 / 255
const WEBP = { quality: 82, alphaQuality: 90, effort: 6 } as const

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

const channel = (x: number, y: number, c: number) => data[(y * width + x) * channels + c] ?? 255
const isInk = (x: number, y: number) =>
  WHITE - Math.min(channel(x, y, 0), channel(x, y, 1), channel(x, y, 2)) > INK_THRESHOLD

// Bounding box of the logo, and which columns contain any ink
const inkColumns = new Array<boolean>(width).fill(false)
let minX = width
let minY = height
let maxX = 0
let maxY = 0
for (let y = 0; y < Math.floor(height * LOGO_AREA); y++) {
  for (let x = 0; x < width; x++) {
    if (!isInk(x, y)) continue
    inkColumns[x] = true
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
}
if (maxX <= minX) throw new Error('No logo found in the image')

// The mark and the wordmark are split by the widest run of empty columns
let gapStart = -1
let gapEnd = -1
let runStart = -1
for (let x = minX; x <= maxX; x++) {
  if (!inkColumns[x]) {
    if (runStart === -1) runStart = x
    continue
  }
  if (runStart !== -1 && x - runStart > gapEnd - gapStart) {
    gapStart = runStart
    gapEnd = x
  }
  runStart = -1
}
if (gapStart === -1) throw new Error('Could not find the gap between the mark and the wordmark')

// Rows with ink inside a column range, so each part is trimmed to its own height
function verticalExtent(fromX: number, toX: number) {
  let top = maxY
  let bottom = minY
  for (let y = minY; y <= maxY; y++) {
    for (let x = fromX; x <= toX; x++) {
      if (isInk(x, y)) {
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
        break
      }
    }
  }
  return { top, bottom }
}

function padded(left: number, right: number): Box {
  const { top, bottom } = verticalExtent(left, right)
  const x = Math.max(0, left - PADDING)
  const y = Math.max(0, top - PADDING)
  return {
    left: x,
    top: y,
    width: Math.min(width, right + PADDING + 1) - x,
    height: Math.min(height, bottom + PADDING + 1) - y,
  }
}

// "Colour to alpha" against white: keeps anti-aliased edges smooth on any light background
function toTransparent(box: Box) {
  const out = Buffer.alloc(box.width * box.height * 4)
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const rgb = [0, 1, 2].map((c) => channel(box.left + x, box.top + y, c))
      const raw = Math.min(1, Math.max(0, ...rgb.map((v) => (WHITE - v) / WHITE)))
      const alpha = raw < NOISE_FLOOR ? 0 : raw
      const o = (y * box.width + x) * 4
      rgb.forEach((v, c) => {
        out[o + c] =
          alpha === 0 ? 0 : Math.round(Math.min(255, Math.max(0, (v - WHITE * (1 - alpha)) / alpha)))
      })
      out[o + 3] = Math.round(alpha * 255)
    }
  }
  return sharp(out, { raw: { width: box.width, height: box.height, channels: 4 } })
}

const full = padded(minX, maxX)
const mark = padded(minX, gapStart - 1)

// The full logo appears only on the landing page, at 208px wide: 416px covers 2x screens, and lighter
// compression keeps that page inside its 100 KB first-load budget.
await toTransparent(full)
  .resize({ width: 416 })
  .webp({ quality: 60, alphaQuality: 65, effort: 6 })
  .toFile('src/assets/brand/logo.webp')
await toTransparent(mark).webp(WEBP).toFile('src/assets/brand/logo-mark.webp')

// Square icon source: the mark centred on cream (the app background, palette.cream) with a margin.
// Icons are opaque because the mark's light yellows look speckled on dark launchers when transparent.
const side = Math.round(Math.max(mark.width, mark.height) * 1.25)
const markPng = await toTransparent(mark).png().toBuffer()
await sharp({ create: { width: side, height: side, channels: 4, background: '#FBF5EE' } })
  .composite([{ input: markPng, gravity: 'centre' }])
  .flatten({ background: '#FBF5EE' })
  .png()
  .toFile('public/icon-source.png')

console.table({
  'logo.webp': { width: 416, height: Math.round((full.height * 416) / full.width) },
  'logo-mark.webp': { width: mark.width, height: mark.height },
  'icon-source.png': { width: side, height: side },
})
