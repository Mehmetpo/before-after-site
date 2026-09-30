export const GIF_FPS = 15
export const MAX_GIF_SECONDS = 12

/** Slider positions (0..100) for one full 0 -> 100 -> 0 sweep, eased so it lingers at both ends. */
export function sweepPositions(frames: number): number[] {
  const n = Math.max(0, Math.floor(frames))
  return Array.from({ length: n }, (_, i) => {
    const t = i / n
    const tri = t < 0.5 ? t * 2 : (1 - t) * 2
    const eased = tri * tri * (3 - 2 * tri)
    return Math.round(eased * 100)
  })
}

export function frameCount(seconds: number): number {
  const s = Math.min(MAX_GIF_SECONDS, Math.max(0, Number.isFinite(seconds) ? seconds : 0))
  return Math.max(2, Math.round(s * GIF_FPS))
}
