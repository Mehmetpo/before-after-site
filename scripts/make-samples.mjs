// Generates the hero before/after sample pairs from source photos in raw/.
// Every pair is derived from ONE source photo, so both halves align pixel-perfectly.
//
//   1. Download the source photos listed in public/samples/CREDITS.md into raw/
//      (raw/ is gitignored), keeping the file names below.
//   2. node scripts/make-samples.mjs
//
// Transforms are deliberately exaggerated: the hero cards render these 1600x1200
// images at roughly 300-450px wide, so subtle edits would be invisible.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(root, 'raw')
const OUT = path.join(root, 'public', 'samples')
const W = 1600
const H = 1200
const WEBP = { quality: 80, effort: 6 }

const SRC = {
  colorPortrait: '_joB4Z4XScU.jpg', // Natalie Sierra
  food: 'Dmhjy9fDTKw.jpg', // Metin Ozer
  eyes: 'VrKCuFTGOBI.jpg', // Luca Iaconelli
  city: '5wDq-27_zKI.jpg', // Uran Wang
  hills: 'EKIyHUrUHWU.jpg', // Adriel Kloppenburg
  lake: 'N4C2DMEpWxo.jpg', // Eric Carlson
}

/** Source photo cropped to the shared 4:3 frame, as an in-memory PNG. */
async function base(name, position = 'centre') {
  return sharp(path.join(RAW, name))
    .rotate()
    .resize(W, H, { fit: 'cover', position })
    .toColorspace('srgb')
    .png()
    .toBuffer()
}

const img = (buf) => sharp(buf)

/** Coarse RGB film-style noise, rendered at low resolution and upscaled so it survives downsizing. */
async function noiseLayer(strength, grain = 5) {
  const w = Math.ceil(W / grain)
  const h = Math.ceil(H / grain)
  const data = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    const lum = (Math.random() + Math.random() + Math.random() - 1.5) * strength
    for (let c = 0; c < 3; c++) {
      const chroma = (Math.random() - 0.5) * strength * 0.9
      data[i * 3 + c] = Math.max(0, Math.min(255, Math.round(128 + lum + chroma)))
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .resize(W, H, { kernel: 'cubic' })
    .png()
    .toBuffer()
}

/** Warm top-down gradient used for the golden-hour grade. */
function goldenGradient() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff7a2e" stop-opacity="0.95"/>
        <stop offset="0.45" stop-color="#ffb25a" stop-opacity="0.75"/>
        <stop offset="1" stop-color="#c2552a" stop-opacity="0.7"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.18" cy="0.12" r="0.55">
        <stop offset="0" stop-color="#ffd27a" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#ffd27a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#sun)"/>
  </svg>`
  return Buffer.from(svg)
}

const PAIRS = [
  {
    slug: 'colorize',
    src: SRC.colorPortrait,
    position: 'centre',
    before: (b) => img(b).grayscale().linear(1.05, -4),
    after: (b) => img(b),
  },
  {
    slug: 'grade',
    src: SRC.food,
    before: (b) =>
      img(b)
        .modulate({ saturation: 0.4, brightness: 1.05 })
        .linear([0.52, 0.56, 0.5], [78, 84, 76]),
    after: (b) => img(b).modulate({ saturation: 1.3 }).linear(1.12, -10),
  },
  {
    slug: 'sharpen',
    src: SRC.eyes,
    before: (b) => img(b).blur(14),
    after: (b) => img(b).sharpen({ sigma: 1.2 }),
  },
  {
    slug: 'upscale',
    src: SRC.city,
    before: async (b) => {
      const tiny = await img(b).resize(Math.round(W * 0.07)).png().toBuffer()
      return img(tiny).resize(W, H, { kernel: 'nearest' })
    },
    after: (b) => img(b).linear(1.1, 6).modulate({ saturation: 1.1 }),
  },
  {
    slug: 'exposure',
    src: SRC.eyes,
    before: (b) => img(b).linear(1.25, 52).modulate({ saturation: 0.75 }),
    after: (b) => img(b).linear(1.06, -6).modulate({ saturation: 1.08 }),
  },
  {
    slug: 'denoise',
    src: SRC.city,
    before: async (b) => {
      const dark = await img(b).linear(0.6, 0).modulate({ saturation: 0.8 }).raw().toBuffer()
      const noise = await sharp(await noiseLayer(120)).raw().toBuffer()
      const out = Buffer.alloc(dark.length)
      // Additive sensor-style noise; keeps the underlying colors instead of flattening them.
      for (let i = 0; i < dark.length; i++) out[i] = Math.max(0, Math.min(255, dark[i] + (noise[i] - 128) * 0.55))
      return sharp(out, { raw: { width: W, height: H, channels: 3 } })
    },
    after: (b) => img(b).gamma(2.2, 1.6).linear(1.08, 0).modulate({ saturation: 1.15 }),
  },
  {
    slug: 'mood',
    src: SRC.hills,
    before: (b) => img(b).linear([0.94, 1.0, 1.1], [0, 2, 8]),
    after: async (b) => {
      const warm = await img(b)
        .linear([1.1, 0.96, 0.66], [8, 0, -6])
        .modulate({ saturation: 1.25, brightness: 0.95 })
        .png()
        .toBuffer()
      return img(warm).composite([{ input: goldenGradient(), blend: 'soft-light' }])
    },
  },
  {
    slug: 'hdr',
    src: SRC.lake,
    before: (b) => img(b).modulate({ saturation: 0.5 }).linear(0.6, 52),
    after: async (b) => {
      const local = await img(b).clahe({ width: 160, height: 160, maxSlope: 4 }).png().toBuffer()
      return img(local).modulate({ saturation: 1.45, brightness: 1.05 }).linear(1.12, -10)
    },
  },
]

await mkdir(OUT, { recursive: true })
for (const p of PAIRS) {
  const b = await base(p.src, p.position)
  for (const which of ['before', 'after']) {
    const pipeline = await p[which](b)
    const file = path.join(OUT, `${p.slug}-${which}.webp`)
    const info = await pipeline.webp(WEBP).toFile(file)
    if (info.width !== W || info.height !== H) throw new Error(`${file}: ${info.width}x${info.height}`)
    console.log(`${p.slug}-${which}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`)
  }
}
