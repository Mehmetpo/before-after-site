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
