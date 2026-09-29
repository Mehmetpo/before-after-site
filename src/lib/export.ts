import type { Format } from '@/lib/compare-state'
import type { ExportKind } from '@/lib/render'

const MIME: Record<Format, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

export const mimeFor = (f: Format) => MIME[f]
export const extFor = (f: Format) => (f === 'jpeg' ? 'jpg' : f)
export const qualityFor = (f: Format, pct: number) => (f === 'png' ? undefined : pct / 100)

export function buildFilename(kind: ExportKind, f: Format, now = new Date()): string {
  return `before-after-${kind}-${now.toISOString().slice(0, 10)}.${extFor(f)}`
}

export function canvasToBlob(canvas: HTMLCanvasElement, f: Format, qualityPct: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image. Try a smaller image or another format.'))),
      mimeFor(f),
      qualityFor(f, qualityPct),
    )
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
