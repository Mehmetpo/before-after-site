import { describe, expect, it } from 'vitest'
import { applyEnhance, isNeutralEnhance, NEUTRAL_ENHANCE, type Enhance } from '@/lib/enhance'

const make = (w: number, h: number, fn: (x: number, y: number) => [number, number, number]) => {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y)
      const i = (y * w + x) * 4
      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
      d[i + 3] = 255
    }
  return d
}
const run = (d: Uint8ClampedArray, w: number, h: number, patch: Partial<Enhance>) =>
  applyEnhance(d, w, h, { ...NEUTRAL_ENHANCE, ...patch })
const lum = (d: Uint8ClampedArray, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]

describe('enhance', () => {
  it('neutral settings are detected and leave pixels untouched', () => {
    expect(isNeutralEnhance(NEUTRAL_ENHANCE)).toBe(true)
    expect(isNeutralEnhance({ ...NEUTRAL_ENHANCE, sharpen: 10 })).toBe(false)
    const d = make(4, 4, (x, y) => [x * 40, y * 40, 100])
    const copy = new Uint8ClampedArray(d)
    run(d, 4, 4, {})
    expect([...d]).toEqual([...copy])
  })

  it('exposure +1 EV brightens and -1 EV darkens, keeping alpha', () => {
    const up = make(2, 2, () => [80, 80, 80])
    run(up, 2, 2, { exposure: 1 })
    expect(up[0]).toBeGreaterThan(80)
    expect(up[3]).toBe(255)
    const down = make(2, 2, () => [80, 80, 80])
    run(down, 2, 2, { exposure: -1 })
    expect(down[0]).toBeLessThan(80)
  })

  it('exposure never overflows on white or black', () => {
    const d = make(2, 2, (x) => (x ? [255, 255, 255] : [0, 0, 0]))
    run(d, 2, 2, { exposure: 2 })
    expect(d[4]).toBe(255)
    expect(d[0]).toBe(0)
  })

  it('saturation 0 turns pixels grey; negative warmth shifts toward blue', () => {
    const d = make(2, 2, () => [200, 100, 50])
    run(d, 2, 2, { saturation: -100 })
    expect(Math.abs(d[0] - d[1])).toBeLessThanOrEqual(1)
    expect(Math.abs(d[1] - d[2])).toBeLessThanOrEqual(1)
    const w = make(2, 2, () => [120, 120, 120])
    run(w, 2, 2, { warmth: -50 })
    expect(w[2]).toBeGreaterThan(w[0])
    const c = make(2, 2, () => [120, 120, 120])
    run(c, 2, 2, { warmth: 50 })
    expect(c[0]).toBeGreaterThan(c[2])
  })

  it('sharpen increases contrast across an edge and leaves flat areas alone', () => {
    const w = 8
    const d = make(w, 4, (x) => (x < 4 ? [90, 90, 90] : [160, 160, 160]))
    run(d, w, 4, { sharpen: 100 })
    const i = (1 * w + 3) * 4
    const j = (1 * w + 4) * 4
    expect(d[i]).toBeLessThan(90)
    expect(d[j]).toBeGreaterThan(160)
    const flat = make(w, 4, () => [128, 128, 128])
    run(flat, w, 4, { sharpen: 100 })
    expect(flat[(1 * w + 1) * 4]).toBe(128)
  })

  it('denoise smooths noise but keeps a strong edge', () => {
    const w = 16
    let seed = 1
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 40
    const d = make(w, w, (x) => {
      const base = x < 8 ? 60 : 200
      const v = Math.round(base + rnd())
      return [v, v, v]
    })
    const variance = (arr: Uint8ClampedArray, x0: number, x1: number) => {
      const vals: number[] = []
      for (let y = 2; y < w - 2; y++) for (let x = x0; x < x1; x++) vals.push(arr[(y * w + x) * 4])
      const m = vals.reduce((a, b) => a + b, 0) / vals.length
      return vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length
    }
    const before = variance(d, 2, 6)
    run(d, w, w, { denoise: 80 })
    expect(variance(d, 2, 6)).toBeLessThan(before / 2)
    // Edge between x=7 and x=8 stays sharp.
    expect(lum(d, (8 * w + 9) * 4) - lum(d, (8 * w + 6) * 4)).toBeGreaterThan(100)
  })

  it('hdr lifts shadows and pulls back highlights', () => {
    const w = 8
    const d = make(w, w, (x) => (x < 4 ? [30, 30, 30] : [235, 235, 235]))
    run(d, w, w, { hdr: 100 })
    expect(d[(3 * w + 0) * 4]).toBeGreaterThan(30)
    expect(d[(3 * w + 7) * 4]).toBeLessThan(235)
  })
})
