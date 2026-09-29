import { describe, expect, it } from 'vitest'
import { initialState, type CompareState } from '@/lib/compare-state'
import { planExport } from '@/lib/render'

const img = (w: number, h: number) => ({ width: w, height: h }) as never
const base = (over: Partial<CompareState> = {}): CompareState => ({
  ...initialState,
  before: img(800, 600),
  after: img(800, 600),
  ...over,
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
  it('snapshot in onion mode uses onionOpacity and multiply-free blending', () => {
    const p = planExport(base({ mode: 'onion', onionOpacity: 60 }), 'snapshot')!
    expect(p.layers[1].alpha).toBeCloseTo(0.6)
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
