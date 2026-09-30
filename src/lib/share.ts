import { isSafeImageUrl } from '@/lib/embed'

export interface ShareSources {
  a: string
  b: string
}

/** Reads `?a=<url>&b=<url>` from the main page; only public https image links are accepted. */
export function parseShareParams(search: string): ShareSources | null {
  const p = new URLSearchParams(search)
  const a = p.get('a')?.trim() ?? ''
  const b = p.get('b')?.trim() ?? ''
  return isSafeImageUrl(a) && isSafeImageUrl(b) ? { a, b } : null
}

export function buildShareUrl(origin: string, a: string, b: string): string {
  return `${origin}/?${new URLSearchParams({ a, b })}`
}

/** Fetches a public image without credentials or referrer. Throws a user-readable message on failure. */
export async function fetchImageFile(url: string): Promise<File> {
  let res: Response
  try {
    res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' })
  } catch {
    throw new Error("The image host does not allow other sites to load it (CORS). Download the image and upload it instead.")
  }
  if (!res.ok) throw new Error(`The link returned an error (${res.status}).`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('The link does not point to an image.')
  const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'image')
  return new File([blob], name, { type: blob.type })
}
