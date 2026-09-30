/** One-click photo enhancements. Pure pixel maths on RGBA buffers, so they run in a worker and in tests. */
export interface Enhance {
  /** Exposure in EV stops, -2..2. */
  exposure: number
  /** Saturation change, -100..100. */
  saturation: number
  /** Colour temperature, -100 (cool) .. 100 (warm). */
  warmth: number
  /** HDR-like tone mapping: lifts shadows, tames highlights, adds local contrast. 0..100. */
  hdr: number
  /** Unsharp-mask amount, 0..100. */
  sharpen: number
  /** Edge-preserving noise reduction, 0..100. */
  denoise: number
}

export const NEUTRAL_ENHANCE: Enhance = { exposure: 0, saturation: 0, warmth: 0, hdr: 0, sharpen: 0, denoise: 0 }

export const ENHANCE_LIMITS: Record<keyof Enhance, { min: number; max: number; step: number }> = {
  exposure: { min: -2, max: 2, step: 0.1 },
  saturation: { min: -100, max: 100, step: 1 },
  warmth: { min: -100, max: 100, step: 1 },
  hdr: { min: 0, max: 100, step: 1 },
  sharpen: { min: 0, max: 100, step: 1 },
  denoise: { min: 0, max: 100, step: 1 },
}

export function isNeutralEnhance(e: Enhance): boolean {
  return (Object.keys(NEUTRAL_ENHANCE) as (keyof Enhance)[]).every((k) => e[k] === NEUTRAL_ENHANCE[k])
}

export function clampEnhance(key: keyof Enhance, value: number): number {
  const { min, max, step } = ENHANCE_LIMITS[key]
  const v = Number.isFinite(value) ? value : 0
  const snapped = Math.round(v / step) * step
  return Math.min(max, Math.max(min, Number(snapped.toFixed(2))))
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)

/** Separable box blur over the RGB channels with clamped edges. Returns RGB floats (3 per pixel). */
function boxBlurRGB(data: Uint8ClampedArray, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h * 3)
  const out = new Float32Array(w * h * 3)
  const size = 2 * r + 1
  // Horizontal pass.
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0
      for (let k = -r; k <= r; k++) sum += data[(y * w + Math.min(w - 1, Math.max(0, k))) * 4 + c]
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 3 + c] = sum / size
        const add = Math.min(w - 1, x + r + 1)
        const sub = Math.max(0, x - r)
        sum += data[(y * w + add) * 4 + c] - data[(y * w + sub) * 4 + c]
      }
    }
  }
  // Vertical pass.
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0
      for (let k = -r; k <= r; k++) sum += tmp[(Math.min(h - 1, Math.max(0, k)) * w + x) * 3 + c]
      for (let y = 0; y < h; y++) {
        out[(y * w + x) * 3 + c] = sum / size
        const add = Math.min(h - 1, y + r + 1)
        const sub = Math.max(0, y - r)
        sum += tmp[(add * w + x) * 3 + c] - tmp[(sub * w + x) * 3 + c]
      }
    }
  }
  return out
}

function denoise(data: Uint8ClampedArray, w: number, h: number, strength: number): void {
  const src = new Uint8ClampedArray(data)
  const radius = 2
  const sigmaS2 = 2 * 1.5 * 1.5
  const sigmaR = 10 + strength * 0.6
  const sigmaR2 = 2 * sigmaR * sigmaR
  const mix = Math.min(1, strength / 50)
  // Precompute spatial weights.
  const sw: number[] = []
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) sw.push(Math.exp(-(dx * dx + dy * dy) / sigmaS2))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let r = 0
      let g = 0
      let b = 0
      let wsum = 0
      let n = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy))
        for (let dx = -radius; dx <= radius; dx++, n++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx))
          const j = (yy * w + xx) * 4
          const dr = src[j] - src[i]
          const dg = src[j + 1] - src[i + 1]
          const db = src[j + 2] - src[i + 2]
          const wt = sw[n] * Math.exp(-((dr * dr + dg * dg + db * db) / 3) / sigmaR2)
          r += src[j] * wt
          g += src[j + 1] * wt
          b += src[j + 2] * wt
          wsum += wt
        }
      }
      data[i] = src[i] + (r / wsum - src[i]) * mix
      data[i + 1] = src[i + 1] + (g / wsum - src[i + 1]) * mix
      data[i + 2] = src[i + 2] + (b / wsum - src[i + 2]) * mix
    }
  }
}

function exposure(data: Uint8ClampedArray, ev: number): void {
  const gain = 2 ** ev
  const lut = new Uint8ClampedArray(256)
  // Scale in (approximately) linear light so highlights roll off like a real exposure change.
  for (let i = 0; i < 256; i++) lut[i] = Math.round(clamp255(255 * ((i / 255) ** 2.2 * gain) ** (1 / 2.2)))
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]]
    data[i + 1] = lut[data[i + 1]]
    data[i + 2] = lut[data[i + 2]]
  }
}

function hdr(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  const a = amount / 100
  const radius = Math.max(2, Math.round(Math.min(w, h) / 60))
  const blur = boxBlurRGB(data, w, h, radius)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    // Flatten the tonal range: shadows up, highlights down, mid-tones untouched.
    const target = l + a * 0.25 * (0.5 - l) * 4 * l * (1 - l)
    const gain = (target + 0.004) / (l + 0.004)
    // Local contrast ("clarity") from the difference against a wide blur.
    const boost = a * 0.6
    data[i] = clamp255(r * gain + boost * (r - blur[p * 3]))
    data[i + 1] = clamp255(g * gain + boost * (g - blur[p * 3 + 1]))
    data[i + 2] = clamp255(b * gain + boost * (b - blur[p * 3 + 2]))
  }
}

function grade(data: Uint8ClampedArray, saturation: number, warmth: number): void {
  const s = 1 + saturation / 100
  const rGain = 1 + (warmth / 100) * 0.15
  const bGain = 1 - (warmth / 100) * 0.15
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * rGain
    let g = data[i + 1]
    let b = data[i + 2] * bGain
    const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = grey + (r - grey) * s
    g = grey + (g - grey) * s
    b = grey + (b - grey) * s
    data[i] = clamp255(r)
    data[i + 1] = clamp255(g)
    data[i + 2] = clamp255(b)
  }
}

function sharpen(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  const k = (amount / 100) * 1.5
  const blur = boxBlurRGB(data, w, h, 1)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    data[i] = clamp255(data[i] + k * (data[i] - blur[p * 3]))
    data[i + 1] = clamp255(data[i + 1] + k * (data[i + 1] - blur[p * 3 + 1]))
    data[i + 2] = clamp255(data[i + 2] + k * (data[i + 2] - blur[p * 3 + 2]))
  }
}

/** Applies every non-neutral enhancement in place: denoise, exposure, HDR tone, colour grade, then sharpen. */
export function applyEnhance(data: Uint8ClampedArray, w: number, h: number, e: Enhance): void {
  if (e.denoise > 0) denoise(data, w, h, e.denoise)
  if (e.exposure !== 0) exposure(data, e.exposure)
  if (e.hdr > 0) hdr(data, w, h, e.hdr)
  if (e.saturation !== 0 || e.warmth !== 0) grade(data, e.saturation, e.warmth)
  if (e.sharpen > 0) sharpen(data, w, h, e.sharpen)
}
