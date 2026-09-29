import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VIEW, MAX_ZOOM, MIN_ZOOM, clampPan, cssTransform, rotateBy, zoomBy,
} from '@/lib/transform'

describe('transform', () => {
  it('clamps zoom to the allowed range', () => {
    expect(zoomBy(DEFAULT_VIEW, 100).zoom).toBe(MAX_ZOOM)
    expect(zoomBy(DEFAULT_VIEW, 0.001).zoom).toBe(MIN_ZOOM)
  })
  it('resets pan when zoom returns to 1', () => {
    const v = { ...DEFAULT_VIEW, zoom: 2, panX: 40, panY: 10 }
    const out = zoomBy(v, 0.5)
    expect(out.zoom).toBe(1)
    expect(out.panX).toBe(0)
    expect(out.panY).toBe(0)
  })
  it('clamps pan to half the overflow', () => {
    const v = { ...DEFAULT_VIEW, zoom: 2, panX: 999, panY: -999 }
    expect(clampPan(v, { w: 200, h: 100 })).toMatchObject({ panX: 100, panY: -50 })
  })
  it('rotates in 90 degree steps and wraps', () => {
    expect(rotateBy(DEFAULT_VIEW, 90).rotation).toBe(90)
    expect(rotateBy({ ...DEFAULT_VIEW, rotation: 270 }, 90).rotation).toBe(0)
    expect(rotateBy(DEFAULT_VIEW, -90).rotation).toBe(270)
  })
  it('emits a css transform', () => {
    expect(cssTransform({ zoom: 2, panX: 10, panY: 5, rotation: 90 })).toBe(
      'translate(10px, 5px) rotate(90deg) scale(2)',
    )
  })
})
