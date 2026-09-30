import { describe, expect, it } from 'vitest'
import { afterEach, vi } from 'vitest'
import { fitWithin, loadImage, selectFiles, validateFile } from '@/lib/image-load'

const f = (name: string, type: string) => ({ name, type }) as File

describe('validateFile', () => {
  it('accepts png/jpeg/webp/gif/avif', () => {
    for (const t of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']) {
      expect(validateFile(f('a', t))).toEqual({ ok: true })
    }
  })
  it('rejects HEIC by mime type', () => {
    const r = validateFile(f('a.heic', 'image/heic'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/HEIC/i)
  })
  it('rejects HEIC by extension when mime is empty', () => {
    expect(validateFile(f('IMG_1.HEIF', '')).ok).toBe(false)
  })
  it('rejects non-images', () => {
    const r = validateFile(f('a.pdf', 'application/pdf'))
    expect(r.ok).toBe(false)
  })
})

describe('fitWithin', () => {
  it('leaves small images alone', () => {
    expect(fitWithin(800, 600, 4096)).toEqual({ width: 800, height: 600, scaled: false })
  })
  it('scales the longest side down, keeping aspect', () => {
    expect(fitWithin(8000, 4000, 4000)).toEqual({ width: 4000, height: 2000, scaled: true })
    expect(fitWithin(3000, 6000, 3000)).toEqual({ width: 1500, height: 3000, scaled: true })
  })
})

describe('loadImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('closes the probe bitmap when the resized decode throws', async () => {
    const close = vi.fn()
    const probe = { width: 8000, height: 6000, close }
    const create = vi.fn().mockResolvedValueOnce(probe).mockRejectedValueOnce(new Error('boom'))
    vi.stubGlobal('createImageBitmap', create)
    await expect(loadImage(f('a.png', 'image/png') as File)).rejects.toThrow('boom')
    expect(close).toHaveBeenCalledTimes(1)
  })
})

describe('selectFiles', () => {
  it('validates first, then takes the first two valid files', () => {
    const files = [f('a.heic', 'image/heic'), f('b.png', 'image/png'), f('c.txt', 'text/plain'), f('d.jpg', 'image/jpeg'), f('e.png', 'image/png')]
    const r = selectFiles(files)
    expect(r.accepted.map((x) => x.name)).toEqual(['b.png', 'd.jpg'])
    expect(r.rejected.map((x) => x.file.name)).toEqual(['a.heic', 'c.txt'])
  })
})
