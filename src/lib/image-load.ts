export const MAX_SIDE = 4096
const OK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])

export interface LoadedImage {
  name: string
  bitmap: ImageBitmap
  url: string
  width: number
  height: number
  resizedFrom?: { width: number; height: number }
}

export type Validation = { ok: true } | { ok: false; reason: string }

export function validateFile(file: Pick<File, 'name' | 'type'>): Validation {
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  if (isHeic) {
    return { ok: false, reason: 'HEIC/HEIF is not supported. Export the photo as JPEG or PNG first.' }
  }
  if (!OK_TYPES.has(file.type)) {
    return { ok: false, reason: `Unsupported file type${file.type ? ` (${file.type})` : ''}.` }
  }
  return { ok: true }
}

export function fitWithin(w: number, h: number, max: number) {
  const longest = Math.max(w, h)
  if (longest <= max) return { width: w, height: h, scaled: false }
  const k = max / longest
  return { width: Math.round(w * k), height: Math.round(h * k), scaled: true }
}

/** Decodes a validated file. Throws on decode failure; callers show a toast. */
export async function loadImage(file: File, max = MAX_SIDE): Promise<LoadedImage> {
  const probe = await createImageBitmap(file)
  const from = { width: probe.width, height: probe.height }
  const fit = fitWithin(from.width, from.height, max)
  let bitmap = probe
  if (fit.scaled) {
    bitmap = await createImageBitmap(file, {
      resizeWidth: fit.width,
      resizeHeight: fit.height,
      resizeQuality: 'high',
    })
    probe.close()
  }
  return {
    name: file.name,
    bitmap,
    url: URL.createObjectURL(file),
    width: bitmap.width,
    height: bitmap.height,
    resizedFrom: fit.scaled ? from : undefined,
  }
}

export function disposeImage(img: LoadedImage | null): void {
  if (!img) return
  img.bitmap.close()
  URL.revokeObjectURL(img.url)
}
