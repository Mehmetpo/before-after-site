import { describe, expect, it } from 'vitest'
import { buildShareUrl, parseShareParams } from '@/lib/share'

const A = 'https://example.com/a.jpg'
const B = 'https://cdn.example.org/b.png?x=1&y=2'

describe('share links', () => {
  it('round-trips two https image URLs', () => {
    const url = buildShareUrl('https://site.test', A, B)
    expect(url.startsWith('https://site.test/?')).toBe(true)
    expect(parseShareParams(new URL(url).search)).toEqual({ a: A, b: B })
  })
  it('returns null unless both URLs are safe https links', () => {
    expect(parseShareParams('')).toBeNull()
    expect(parseShareParams(`?a=${encodeURIComponent(A)}`)).toBeNull()
    expect(parseShareParams(`?a=${encodeURIComponent(A)}&b=javascript:alert(1)`)).toBeNull()
    expect(parseShareParams(`?a=${encodeURIComponent(A)}&b=http://insecure.test/x.png`)).toBeNull()
  })
})
