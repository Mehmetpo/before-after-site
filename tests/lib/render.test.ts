import { describe, expect, it } from 'vitest'
import { initialState, type CompareState } from '@/lib/compare-state'
import { MAX_EXPORT_PIXELS, capSize, planExport } from '@/lib/render'

const img = (w: number, h: number) => ({ width: w, height: h }) as never
const base = (over: Partial<CompareState> = {}): CompareState => ({
  ...initialState,
  before: img(800, 600),
  after: img(800, 600),
  ...over,
})

describe('planExport maxSide', () => {
  it('shrinks the longest side to maxSide and scales pan/zoom consistently', () => {
    const p = planExport(base({ mode: 'slider' }), 'snapshot', undefined, { maxSide: 400 })!
    expect(Math.max(p.width, p.height)).toBe(400)
    expect(p.width).toBe(400)
    expect(p.height).toBe(300)
    expect(p.scale).toBeCloseTo(0.5, 3)
  })
  it('does not upscale small content', () => {
    const p = planExport(base(), 'snapshot', undefined, { maxSide: 5000 })!
    expect(p.width).toBe(800)
    expect(p.scale).toBe(1)
  })
})

describe('planExport', () => {
  it('returns null without both images', () => {
    expect(planExport({ ...initialState }, 'snapshot')).toBeNull()
  })
  it('combined is two images side by side at the before size', () => {
    const p = planExport(base(), 'combined')!
    expect(p.width).toBe(1600)
    expect(p.height).toBe(600)
    expect(p.layers).toHaveLength(2)
    expect(p.layers[1]).toMatchObject({ which: 'after', dx: 800, dw: 800 })
  })
  it('snapshot in slider mode clips the after image at sliderPct', () => {
    const p = planExport(base({ mode: 'slider', sliderPct: 25 }), 'snapshot')!
    expect(p.width).toBe(800)
    expect(p.layers[1].clip).toEqual({ x: 200, y: 0, w: 600, h: 600 })
  })
  it('snapshot in fade mode uses fadeOpacity as after alpha', () => {
    const p = planExport(base({ mode: 'fade', fadeOpacity: 30 }), 'snapshot')!
    expect(p.layers[1].alpha).toBeCloseTo(0.3)
  })
  it('snapshot in onion mode blends the after image with difference at onionOpacity', () => {
    const p = planExport(base({ mode: 'onion', onionOpacity: 60 }), 'snapshot')!
    expect(p.layers[1].alpha).toBeCloseTo(0.6)
    expect(p.layers[1].blend).toBe('difference')
    expect(p.layers[0].blend).toBeUndefined()
  })
  it('fade mode stays a plain alpha crossfade', () => {
    expect(planExport(base({ mode: 'fade' }), 'snapshot')!.layers[1].blend).toBeUndefined()
  })
  it('snapshot in side mode equals the combined layout', () => {
    const a = planExport(base({ mode: 'side' }), 'snapshot')!
    const b = planExport(base(), 'combined')!
    expect(a.layers.map((l) => l.dx)).toEqual(b.layers.map((l) => l.dx))
  })
  it('fits the after image into the before-sized cell, keeping aspect', () => {
    const p = planExport(base({ after: img(400, 600) }), 'combined')!
    expect(p.layers[1]).toMatchObject({ dw: 400, dh: 600, dx: 800 + 200 })
  })
  it('swaps output dimensions for 90 degree rotation', () => {
    const p = planExport(base({ mode: 'fade', view: { zoom: 1, panX: 0, panY: 0, rotation: 90 } }), 'snapshot')!
    expect(p.width).toBe(600)
    expect(p.height).toBe(800)
  })
  it('carries the same filter for both export kinds (regression: old dlCombined/dlSnapshot)', () => {
    const s = base({ adjust: { brightness: 120, contrast: 90 } })
    expect(planExport(s, 'combined')!.filter).toBe(planExport(s, 'snapshot')!.filter)
  })
})

describe('planExport pan units', () => {
  const view = { zoom: 2, panX: 50, panY: -20, rotation: 0 as const }
  it('scales CSS-px pan by content size over viewer box size', () => {
    // 800x600 content shown in a 400x300 box: 1 CSS px = 2 canvas px.
    const p = planExport(base({ mode: 'fade', view }), 'snapshot', { w: 400, h: 300 })!
    expect(p.panX).toBeCloseTo(100)
    expect(p.panY).toBeCloseTo(-40)
  })
  it('scales pan in side mode using the doubled content width', () => {
    // 1600x600 output shown in an 800x300 box: factor 2 on both axes.
    const p = planExport(base({ mode: 'side', view }), 'snapshot', { w: 800, h: 300 })!
    expect(p.panX).toBeCloseTo(100)
    expect(p.panY).toBeCloseTo(-40)
  })
  it('uses output (post-rotation) dimensions for the scale at quarter turns', () => {
    // 90deg: output is 600x800; box is 300x400 -> factor 2.
    const p = planExport(base({ mode: 'fade', view: { ...view, rotation: 90 } }), 'snapshot', { w: 300, h: 400 })!
    expect(p.panX).toBeCloseTo(100)
    expect(p.panY).toBeCloseTo(-40)
  })
  it('keeps pan unscaled when no box is given', () => {
    const p = planExport(base({ mode: 'fade', view }), 'snapshot')!
    expect(p.panX).toBe(50)
  })
  it('ignores pan for combined exports', () => {
    expect(planExport(base({ view }), 'combined', { w: 400, h: 300 })!.panX).toBe(0)
  })
})

describe('canvas area cap', () => {
  it('leaves small plans untouched', () => {
    const p = planExport(base(), 'combined')!
    expect(p.scale).toBe(1)
    expect(p.width).toBe(1600)
  })
  it('scales oversized combined plans under the pixel cap, keeping aspect', () => {
    const p = planExport(base({ before: img(4096, 4096), after: img(4096, 4096) }), 'combined')!
    expect(p.width * p.height).toBeLessThanOrEqual(MAX_EXPORT_PIXELS)
    expect(p.scale).toBeLessThan(1)
    expect(p.width / p.height).toBeCloseTo(2, 1)
  })
  it('scales pan with the plan', () => {
    const view = { zoom: 2, panX: 10, panY: 0, rotation: 0 as const }
    const p = planExport(base({ before: img(4096, 4096), after: img(4096, 4096), mode: 'side', view }), 'snapshot', { w: 8192, h: 4096 })!
    expect(p.panX).toBeCloseTo(10 * p.scale)
  })
  it('capSize keeps the area at or under the max', () => {
    const c = capSize(10000, 5000, 1_000_000)
    expect(c.width * c.height).toBeLessThanOrEqual(1_000_000)
    expect(c.scale).toBeCloseTo(Math.sqrt(1_000_000 / 50_000_000), 2)
    expect(capSize(100, 100, 1_000_000)).toEqual({ width: 100, height: 100, scale: 1 })
  })
})

describe('export background', () => {
  it('fills jpeg and webp with white, leaves png transparent', () => {
    expect(planExport(base({ format: 'jpeg' }), 'combined')!.background).toBe('#ffffff')
    expect(planExport(base({ format: 'webp' }), 'snapshot')!.background).toBe('#ffffff')
    expect(planExport(base({ format: 'png' }), 'combined')!.background).toBeNull()
  })
})
