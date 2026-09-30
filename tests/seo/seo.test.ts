import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')
const SITE = 'https://before-after-site-ten.vercel.app'

describe('index.html metadata', () => {
  const html = read('index.html')

  it('has a keyword-rich title and description of sane length', () => {
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1] ?? ''
    expect(title.toLowerCase()).toContain('before and after slider')
    expect(title.length).toBeLessThanOrEqual(65)
    const desc = /<meta name="description" content="([^"]+)"/.exec(html)?.[1] ?? ''
    expect(desc.length).toBeGreaterThanOrEqual(80)
    expect(desc.length).toBeLessThanOrEqual(160)
  })

  it('declares canonical, Open Graph and Twitter tags with absolute URLs', () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE}/"`)
    for (const p of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:alt'])
      expect(html).toContain(`property="${p}"`)
    expect(html).toContain(`content="${SITE}/og-image.png"`)
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('name="twitter:image"')
  })

  it('embeds valid WebApplication JSON-LD', () => {
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1]
    expect(raw).toBeTruthy()
    const ld = JSON.parse(raw!)
    expect(ld['@type']).toBe('WebApplication')
    expect(ld.url).toBe(`${SITE}/`)
    expect(ld.offers.price).toBe('0')
  })

  it('ships crawlable fallback content inside #root', () => {
    expect(html).toMatch(/<div id="root">[\s\S]*<h1>[\s\S]*<\/h1>[\s\S]*<\/div>/)
  })
})

describe('crawler files', () => {
  it('robots.txt allows crawling and points at the sitemap', () => {
    const robots = read('public/robots.txt')
    expect(robots).toMatch(/User-agent: \*/)
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m)
  })

  it('sitemap.xml lists the home page', () => {
    const xml = read('public/sitemap.xml')
    expect(xml).toContain(`<loc>${SITE}/</loc>`)
  })

  it('has a 1200x630 social preview image', () => {
    const file = path.join(root, 'public/og-image.png')
    expect(existsSync(file)).toBe(true)
    const buf = readFileSync(file)
    expect(buf.readUInt32BE(16)).toBe(1200)
    expect(buf.readUInt32BE(20)).toBe(630)
  })
})

describe('embed page', () => {
  it('is noindex and kept out of the sitemap', () => {
    expect(read('embed.html')).toMatch(/<meta name="robots" content="noindex/)
    expect(read('public/sitemap.xml')).not.toContain('/embed')
    expect(read('public/robots.txt')).not.toMatch(/Disallow:\s*\/embed/)
  })

  it('vercel.json frames /embed everywhere and the rest of the site only on itself', () => {
    const { headers } = JSON.parse(read('vercel.json')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[]
    }
    const csp = (h: (typeof headers)[number]) => h.headers.find((x) => x.key === 'Content-Security-Policy')?.value
    const embed = headers.find((h) => h.source === '/embed')!
    expect(csp(embed)).toBe('frame-ancestors *')
    expect(embed.headers.some((x) => x.key === 'X-Frame-Options')).toBe(false)
    const others = headers.filter((h) => h.source !== '/embed')
    expect(others.length).toBeGreaterThan(0)
    for (const h of others) expect(csp(h)).toBe("frame-ancestors 'self'")
    // The catch-all excludes /embed via a negative lookahead.
    expect(others.map((h) => h.source)).toEqual(['/', '/:path((?!embed$).+)'])
  })
})
