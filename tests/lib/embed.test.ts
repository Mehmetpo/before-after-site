import { describe, expect, it } from 'vitest'
import { buildEmbedUrl, buildIframeCode, DEFAULT_EMBED, isSafeImageUrl, parseEmbedParams } from '@/lib/embed'

const A = 'https://cdn.example.com/before.jpg'
const B = 'https://cdn.example.com/after.jpg?x=1&y=2'
const q = (o: Record<string, string>) => new URLSearchParams(o).toString()

describe('isSafeImageUrl', () => {
  it('accepts plain https URLs', () => {
    expect(isSafeImageUrl(A)).toBe(true)
    expect(isSafeImageUrl(B)).toBe(true)
  })
  it.each([
    'http://example.com/a.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'blob:https://x.com/1',
    'file:///etc/passwd',
    '//example.com/a.jpg',
    '/relative.jpg',
    'https://user:pw@example.com/a.jpg',
    '',
    'not a url',
  ])('rejects %s', (u) => expect(isSafeImageUrl(u)).toBe(false))
  it('rejects overlong URLs', () => {
    expect(isSafeImageUrl('https://e.com/' + 'a'.repeat(2100))).toBe(false)
  })
})

describe('parseEmbedParams', () => {
  it('parses a minimal valid query with defaults', () => {
    const r = parseEmbedParams('?' + q({ a: A, b: B }))
    expect(r).toEqual({ ok: true, config: { ...DEFAULT_EMBED, a: A, b: B } })
  })
  it('clamps and rounds pos', () => {
    const pos = (v: string) => {
      const r = parseEmbedParams('?' + q({ a: A, b: B, pos: v }))
      return r.ok ? r.config.pos : null
    }
    expect(pos('30')).toBe(30)
    expect(pos('-20')).toBe(0)
    expect(pos('250')).toBe(100)
    expect(pos('abc')).toBe(50)
  })
  it('trims and caps labels, falling back to defaults when empty', () => {
    const r = parseEmbedParams('?' + q({ a: A, b: B, la: '  Old  ', lb: 'x'.repeat(100) }))
    expect(r.ok && r.config.la).toBe('Old')
    expect(r.ok && r.config.lb.length).toBe(24)
    const e = parseEmbedParams('?' + q({ a: A, b: B, la: '   ' }))
    expect(e.ok && e.config.la).toBe('Before')
  })
  it('keeps label markup as inert text (React escapes it on render)', () => {
    const r = parseEmbedParams('?' + q({ a: A, b: B, la: '<b onmouseover=x>hi</b>' }))
    expect(r.ok && r.config.la).toBe('<b onmouseover=x>hi</b>')
  })
  it('parses fit and intro switches, ignoring junk', () => {
    const r = parseEmbedParams('?' + q({ a: A, b: B, fit: 'contain', intro: '0' }))
    expect(r.ok && r.config.fit).toBe('contain')
    expect(r.ok && r.config.intro).toBe(false)
    const j = parseEmbedParams('?' + q({ a: A, b: B, fit: 'zoom', intro: 'maybe' }))
    expect(j.ok && j.config.fit).toBe('cover')
    expect(j.ok && j.config.intro).toBe(true)
  })
  it('reports which image is missing or unsafe', () => {
    expect(parseEmbedParams('')).toMatchObject({ ok: false })
    expect(parseEmbedParams('?' + q({ a: A }))).toMatchObject({ ok: false, error: expect.stringContaining('after') })
    expect(parseEmbedParams('?' + q({ a: 'javascript:alert(1)', b: B }))).toMatchObject({
      ok: false,
      error: expect.stringContaining('before'),
    })
    expect(parseEmbedParams('?' + q({ a: A, b: 'http://insecure.example/x.jpg' }))).toMatchObject({ ok: false })
  })
})

describe('buildEmbedUrl', () => {
  it('round-trips through parseEmbedParams', () => {
    const config = { a: A, b: B, pos: 35, la: 'Old & new', lb: 'After', fit: 'contain' as const, intro: false }
    const url = new URL(buildEmbedUrl('https://site.test', config))
    expect(url.origin + url.pathname).toBe('https://site.test/embed')
    expect(parseEmbedParams(url.search)).toEqual({ ok: true, config })
  })
  it('omits parameters that equal their defaults', () => {
    const url = new URL(buildEmbedUrl('https://site.test', { ...DEFAULT_EMBED, a: A, b: B }))
    expect([...url.searchParams.keys()].sort()).toEqual(['a', 'b'])
  })
})

describe('buildIframeCode', () => {
  const cfg = { ...DEFAULT_EMBED, a: A, b: B }
  it('emits a lazy, sized, titled iframe', () => {
    const code = buildIframeCode('https://site.test', cfg, { width: 800, height: 500 })
    expect(code).toContain('width="800"')
    expect(code).toContain('height="500"')
    expect(code).toContain('loading="lazy"')
    expect(code).toContain('title="Before and after image comparison"')
    expect(code.startsWith('<iframe ')).toBe(true)
    expect(code.endsWith('</iframe>')).toBe(true)
  })
  it('escapes attribute-breaking characters in the src', () => {
    const code = buildIframeCode('https://site.test', { ...cfg, la: '"><script>alert(1)</script>' }, { width: 800, height: 500 })
    expect(code).not.toContain('<script>')
    expect(code.match(/src="([^"]*)"/)?.[1]).toContain('&amp;')
  })
  it('clamps size to sane bounds', () => {
    const code = buildIframeCode('https://site.test', cfg, { width: 99999, height: 5 })
    expect(code).toContain('width="2000"')
    expect(code).toContain('height="120"')
  })
})
