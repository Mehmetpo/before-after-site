import { describe, expect, it } from 'vitest'
import { buildFilename, extFor, mimeFor, qualityFor } from '@/lib/export'

describe('export helpers', () => {
  it('maps format to mime and extension', () => {
    expect(mimeFor('png')).toBe('image/png')
    expect(mimeFor('jpeg')).toBe('image/jpeg')
    expect(mimeFor('webp')).toBe('image/webp')
    expect(extFor('jpeg')).toBe('jpg')
  })
  it('quality is undefined for png, 0..1 for lossy formats', () => {
    expect(qualityFor('png', 90)).toBeUndefined()
    expect(qualityFor('jpeg', 90)).toBe(0.9)
    expect(qualityFor('webp', 100)).toBe(1)
  })
  it('builds a dated filename', () => {
    expect(buildFilename('combined', 'jpeg', new Date('2026-09-29T10:00:00Z'))).toBe(
      'before-after-combined-2026-09-29.jpg',
    )
    expect(buildFilename('snapshot', 'png', new Date('2026-01-02T10:00:00Z'))).toBe(
      'before-after-snapshot-2026-01-02.png',
    )
  })
})
