import { describe, expect, it } from 'vitest'
import { diffPixels, psnr, ssim } from '@/lib/metrics'

const solid = (w: number, h: number, v: number) => {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < d.length; i += 4) d.set([v, v, v, 255], i)
  return d
}
const noisy = (w: number, h: number, seed = 7) => {
  const d = new Uint8ClampedArray(w * h * 4)
  let s = seed
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 16807) % 2147483647
    const v = s % 256
    d.set([v, v, v, 255], i)
  }
  return d
}

describe('psnr', () => {
  it('is Infinity for identical images', () => {
    expect(psnr(solid(8, 8, 90), solid(8, 8, 90))).toBe(Infinity)
  })
  it('matches the closed form for a uniform difference', () => {
    // MSE = 10^2 -> PSNR = 10*log10(255^2/100)
    expect(psnr(solid(8, 8, 100), solid(8, 8, 110))).toBeCloseTo(10 * Math.log10((255 * 255) / 100), 5)
  })
  it('drops as the difference grows', () => {
    expect(psnr(solid(8, 8, 100), solid(8, 8, 200))).toBeLessThan(psnr(solid(8, 8, 100), solid(8, 8, 110)))
  })
})

describe('ssim', () => {
  it('is 1 for identical images', () => {
    const a = noisy(32, 32)
    expect(ssim(a, new Uint8ClampedArray(a), 32, 32)).toBeCloseTo(1, 6)
  })
  it('is well below 1 for unrelated images', () => {
    expect(ssim(noisy(32, 32, 1), noisy(32, 32, 99), 32, 32)).toBeLessThan(0.3)
  })
  it('is high for a small brightness shift', () => {
    const a = noisy(32, 32)
    const b = new Uint8ClampedArray(a)
    for (let i = 0; i < b.length; i += 4) for (let c = 0; c < 3; c++) b[i + c] = Math.min(255, b[i + c] + 5)
    expect(ssim(a, b, 32, 32)).toBeGreaterThan(0.9)
  })
})

describe('diffPixels', () => {
  it('shows the percentage of pixels differing more than the threshold', () => {
    const a = solid(4, 1, 100)
    const b = solid(4, 1, 100)
    b[0] = 200 // one channel of one pixel
    expect(diffPixels(a, b, 10)).toBeCloseTo(0.25)
    expect(diffPixels(a, b, 120)).toBe(0)
  })
})
