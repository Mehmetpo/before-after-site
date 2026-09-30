import { describe, expect, it } from 'vitest'
import { frameCount, GIF_FPS, sweepPositions } from '@/lib/gif'

describe('sweepPositions', () => {
  it('returns one position per frame, all within 0..100', () => {
    const p = sweepPositions(20)
    expect(p).toHaveLength(20)
    expect(Math.min(...p)).toBe(0)
    expect(Math.max(...p)).toBe(100)
    for (const v of p) expect(Number.isInteger(v)).toBe(true)
  })
  it('sweeps 0 to 100 and back so the loop is seamless', () => {
    const p = sweepPositions(20)
    expect(p[0]).toBe(0)
    expect(p[10]).toBe(100)
    for (let i = 1; i <= 10; i++) expect(p[i]).toBeGreaterThanOrEqual(p[i - 1])
    for (let i = 11; i < 20; i++) expect(p[i]).toBeLessThanOrEqual(p[i - 1])
    // Last frame sits one step before the first, so it is not a duplicate of frame 0.
    expect(p[19]).toBeGreaterThan(0)
  })
  it('handles tiny counts', () => {
    expect(sweepPositions(1)).toEqual([0])
    expect(sweepPositions(0)).toEqual([])
  })
})

describe('frameCount', () => {
  it('derives frames from seconds and caps runaway values', () => {
    expect(frameCount(2)).toBe(2 * GIF_FPS)
    expect(frameCount(1000)).toBeLessThanOrEqual(12 * GIF_FPS)
    expect(frameCount(0)).toBeGreaterThanOrEqual(2)
  })
})
