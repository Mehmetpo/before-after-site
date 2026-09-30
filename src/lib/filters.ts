export interface Adjust {
  brightness: number
  contrast: number
}

export const NEUTRAL_ADJUST: Adjust = { brightness: 100, contrast: 100 }

export function clampPct(v: number): number {
  return Math.min(200, Math.max(0, Math.round(v)))
}

/** Same string is valid for CSS `filter` and canvas `ctx.filter`. */
export function filterString(a: Adjust): string {
  if (a.brightness === 100 && a.contrast === 100) return 'none'
  return `brightness(${a.brightness}%) contrast(${a.contrast}%)`
}

/**
 * In-place RGBA equivalent of `filterString` for canvases without `ctx.filter` (Safari).
 * Mirrors the CSS pipeline: brightness first, then contrast around mid-grey, clamped per stage.
 */
export function adjustPixels(data: Uint8ClampedArray, a: Adjust): void {
  if (a.brightness === 100 && a.contrast === 100) return
  const b = a.brightness / 100
  const c = a.contrast / 100
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) lut[i] = Math.round(clamp((clamp((i / 255) * b) - 0.5) * c + 0.5) * 255)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]]
    data[i + 1] = lut[data[i + 1]]
    data[i + 2] = lut[data[i + 2]]
  }
}
