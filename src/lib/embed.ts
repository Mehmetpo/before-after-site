export interface EmbedConfig {
  a: string
  b: string
  pos: number
  la: string
  lb: string
  fit: 'cover' | 'contain'
  intro: boolean
}

export type EmbedParseResult = { ok: true; config: EmbedConfig } | { ok: false; error: string }

export const MAX_URL_LENGTH = 2048
export const MAX_LABEL_LENGTH = 24
export const EMBED_PATH = '/embed'
export const SITE_URL = 'https://before-after-site-ten.vercel.app/'

export const DEFAULT_EMBED: EmbedConfig = { a: '', b: '', pos: 50, la: 'Before', lb: 'After', fit: 'cover', intro: true }

/** Images are only ever rendered as <img src>; https-only, no credentials, bounded length. */
export function isSafeImageUrl(value: string): boolean {
  if (value.length === 0 || value.length > MAX_URL_LENGTH) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === 'https:' && !url.username && !url.password
}

const label = (raw: string | null, fallback: string) => raw?.trim().slice(0, MAX_LABEL_LENGTH) || fallback

export function parseEmbedParams(search: string): EmbedParseResult {
  const p = new URLSearchParams(search)
  const a = p.get('a')?.trim() ?? ''
  const b = p.get('b')?.trim() ?? ''
  if (!isSafeImageUrl(a)) return { ok: false, error: 'The before image URL is missing or not a valid https link.' }
  if (!isSafeImageUrl(b)) return { ok: false, error: 'The after image URL is missing or not a valid https link.' }

  const rawPos = p.get('pos')
  const pos = Number(rawPos)
  return {
    ok: true,
    config: {
      a,
      b,
      pos: rawPos && Number.isFinite(pos) ? Math.round(Math.min(100, Math.max(0, pos))) : DEFAULT_EMBED.pos,
      la: label(p.get('la'), DEFAULT_EMBED.la),
      lb: label(p.get('lb'), DEFAULT_EMBED.lb),
      fit: p.get('fit') === 'contain' ? 'contain' : 'cover',
      intro: p.get('intro') !== '0',
    },
  }
}

export function buildEmbedUrl(origin: string, config: EmbedConfig): string {
  const q = new URLSearchParams({ a: config.a, b: config.b })
  if (config.pos !== DEFAULT_EMBED.pos) q.set('pos', String(config.pos))
  if (config.la !== DEFAULT_EMBED.la) q.set('la', config.la)
  if (config.lb !== DEFAULT_EMBED.lb) q.set('lb', config.lb)
  if (config.fit !== DEFAULT_EMBED.fit) q.set('fit', config.fit)
  if (!config.intro) q.set('intro', '0')
  return `${origin}${EMBED_PATH}?${q}`
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const clamp = (n: number, lo: number, hi: number) => Math.round(Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo)))

export function buildIframeCode(origin: string, config: EmbedConfig, size: { width: number; height: number }): string {
  const src = escapeAttr(buildEmbedUrl(origin, config))
  const w = clamp(size.width, 200, 2000)
  const h = clamp(size.height, 120, 2000)
  return `<iframe src="${src}" width="${w}" height="${h}" style="border:0;max-width:100%" loading="lazy" allowfullscreen title="Before and after image comparison"></iframe>`
}
