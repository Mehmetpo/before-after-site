import { describe, expect, it } from 'vitest'
import { sampleUrl } from '@/lib/samples'

describe('sampleUrl', () => {
  it('prefixes the configured base URL', () => {
    expect(sampleUrl('hdr', 'before')).toBe(`${import.meta.env?.BASE_URL ?? '/'}samples/hdr-before.webp`)
  })
})
