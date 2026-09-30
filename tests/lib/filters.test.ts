import { describe, expect, it } from 'vitest'
import { clampPct, filterString } from '@/lib/filters'

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
