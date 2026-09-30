/** Image similarity metrics over RGBA buffers of identical size. */

/** Peak signal-to-noise ratio in dB over RGB. Infinity when identical. */
export function psnr(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let sum = 0
  let n = 0
  for (let i = 0; i < a.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const d = a[i + c] - b[i + c]
      sum += d * d
    }
    n += 3
  }
  const mse = n ? sum / n : 0
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse)
}

const luma = (d: Uint8ClampedArray, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]

/** Mean SSIM on luma over non-overlapping 8x8 blocks (standard constants). 1 means identical. */
export function ssim(a: Uint8ClampedArray, b: Uint8ClampedArray, w: number, h: number): number {
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2
  const B = 8
  let total = 0
  let blocks = 0
  for (let by = 0; by + B <= h; by += B) {
    for (let bx = 0; bx + B <= w; bx += B) {
      let sa = 0
      let sb = 0
      let saa = 0
      let sbb = 0
      let sab = 0
      for (let y = 0; y < B; y++)
        for (let x = 0; x < B; x++) {
          const i = ((by + y) * w + bx + x) * 4
          const la = luma(a, i)
          const lb = luma(b, i)
          sa += la
          sb += lb
          saa += la * la
          sbb += lb * lb
          sab += la * lb
        }
      const n = B * B
      const ma = sa / n
      const mb = sb / n
      const va = saa / n - ma * ma
      const vb = sbb / n - mb * mb
      const cov = sab / n - ma * mb
      total += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
      blocks++
    }
  }
  return blocks ? total / blocks : 1
}

/** Fraction (0..1) of pixels where any RGB channel differs by more than `threshold` (0..255). */
export function diffPixels(a: Uint8ClampedArray, b: Uint8ClampedArray, threshold: number): number {
  const px = a.length / 4
  if (!px) return 0
  let hit = 0
  for (let i = 0; i < a.length; i += 4) {
    if (
      Math.abs(a[i] - b[i]) > threshold ||
      Math.abs(a[i + 1] - b[i + 1]) > threshold ||
      Math.abs(a[i + 2] - b[i + 2]) > threshold
    )
      hit++
  }
  return hit / px
}
