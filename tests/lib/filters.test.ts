import { describe, expect, it } from 'vitest'
import { adjustPixels, clampPct, filterString } from '@/lib/filters'

describe('filters', () => {
  it('returns "none" for neutral values', () => {
    expect(filterString({ brightness: 100, contrast: 100 })).toBe('none')
  })
  it('builds a css filter string', () => {
    expect(filterString({ brightness: 120, contrast: 80 })).toBe(
      'brightness(120%) contrast(80%)',
    )
  })
  it('clamps to 0..200 and rounds', () => {
    expect(clampPct(-5)).toBe(0)
    expect(clampPct(250)).toBe(200)
    expect(clampPct(99.6)).toBe(100)
  })
})

describe('adjustPixels (fallback for browsers without ctx.filter)', () => {
  const px = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a])

  it('is a no-op for neutral values', () => {
    const d = px(10, 120, 250)
    adjustPixels(d, { brightness: 100, contrast: 100 })
    expect([...d]).toEqual([10, 120, 250, 255])
  })
  it('scales brightness like css brightness()', () => {
    const d = px(100, 50, 200)
    adjustPixels(d, { brightness: 150, contrast: 100 })
    expect([...d]).toEqual([150, 75, 255, 255])
  })
  it('pivots contrast around mid-grey like css contrast()', () => {
    const d = px(128, 64, 192)
    adjustPixels(d, { brightness: 100, contrast: 50 })
    expect([...d]).toEqual([128, 96, 160, 255])
  })
  it('applies brightness before contrast, clamping between stages', () => {
    const d = px(200, 200, 200)
    // brightness 200% clamps 400 -> 255, then contrast 200%: (255-127.5)*2+127.5 -> 255
    adjustPixels(d, { brightness: 200, contrast: 200 })
    expect([...d]).toEqual([255, 255, 255, 255])
  })
  it('leaves alpha untouched', () => {
    const d = px(100, 100, 100, 77)
    adjustPixels(d, { brightness: 150, contrast: 100 })
    expect(d[3]).toBe(77)
  })
})
