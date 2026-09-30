// Generates public/og-image.png (1200x630) from the HDR sample pair:
// left half is the "before", right half the "after", split by a slider handle.
//
//   node scripts/make-og.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const samples = path.join(root, 'public', 'samples')
const W = 1200
const H = 630
const HALF = W / 2

const fit = (file) => sharp(path.join(samples, file)).resize(W, H, { fit: 'cover' })
const [before, after] = await Promise.all([
  fit('hdr-before.webp').extract({ left: 0, top: 0, width: HALF, height: H }).toBuffer(),
  fit('hdr-after.webp').extract({ left: HALF, top: 0, width: HALF, height: H }).toBuffer(),
])

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.72" stop-color="#000" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="${HALF - 2}" width="4" height="380" fill="#fff"/>
  <circle cx="${HALF}" cy="200" r="30" fill="#fff"/>
  <path d="M${HALF - 8} 200 l-9 -9 v18 z M${HALF + 8} 200 l9 -9 v18 z" fill="#111"/>
  <g font-family="Segoe UI, Arial, Helvetica, sans-serif" fill="#fff">
    <text x="60" y="500" font-size="72" font-weight="700">Before &amp; After Slider</text>
    <text x="60" y="548" font-size="34" opacity="0.92">Compare two images. Free, private, in your browser.</text>
    <text x="60" y="60" font-size="26" font-weight="600" opacity="0.9">BEFORE</text>
    <text x="${W - 60}" y="60" font-size="26" font-weight="600" opacity="0.9" text-anchor="end">AFTER</text>
  </g>
</svg>`)

await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
  .composite([
    { input: before, left: 0, top: 0 },
    { input: after, left: HALF, top: 0 },
    { input: overlay, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'public', 'og-image.png'))
console.log('wrote public/og-image.png')
