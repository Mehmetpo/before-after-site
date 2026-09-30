import { useEffect, useRef, type Dispatch } from 'react'
import { toast } from 'sonner'
import type { Action, CompareState } from '@/lib/compare-state'
import type { LoadedImage } from '@/lib/image-load'
import type { EnhanceRequest, EnhanceResponse } from '@/workers/enhance.worker'

/** Longest side used in enhance mode; keeps the filters (especially denoise) interactive. */
export const ENHANCE_MAX_SIDE = 2048
const DEBOUNCE_MS = 200

function readPixels(bitmap: ImageBitmap): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not read the image.')
  ctx.drawImage(bitmap, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  canvas.width = canvas.height = 0
  return data
}

async function toLoadedImage(data: Uint8ClampedArray<ArrayBuffer>, w: number, h: number, name: string): Promise<LoadedImage> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the enhanced image.')
  ctx.putImageData(new ImageData(data, w, h), 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the enhanced image.'))), 'image/png'),
  )
  canvas.width = canvas.height = 0
  const bitmap = await createImageBitmap(blob)
  return { name, bitmap, url: URL.createObjectURL(blob), width: w, height: h }
}

/**
 * In enhance mode, renders `after` from `before` plus the enhancement settings in a Web Worker
 * (debounced, stale results dropped). Nothing leaves the browser.
 */
export function useEnhance(state: CompareState, dispatch: Dispatch<Action>) {
  const worker = useRef<Worker | null>(null)
  const runId = useRef(0)
  const source = useRef<{ image: LoadedImage; pixels: ImageData } | null>(null)
  const { enhanceMode, before, enhance } = state

  useEffect(
    () => () => {
      worker.current?.terminate()
      worker.current = null
    },
    [],
  )

  useEffect(() => {
    if (!enhanceMode || !before) return
    const id = ++runId.current
    // First render after picking a photo shows the result immediately; later edits are debounced.
    const delay = state.after ? DEBOUNCE_MS : 0
    const timer = window.setTimeout(() => {
      try {
        if (source.current?.image !== before) source.current = { image: before, pixels: readPixels(before.bitmap) }
        const { pixels } = source.current
        worker.current ??= new Worker(new URL('../workers/enhance.worker.ts', import.meta.url), { type: 'module' })
        const w = worker.current
        const onMessage = (e: MessageEvent<EnhanceResponse>) => {
          if (e.data.id !== id) return
          w.removeEventListener('message', onMessage)
          if (id !== runId.current) return
          void toLoadedImage(new Uint8ClampedArray(e.data.buffer), pixels.width, pixels.height, `enhanced-${before.name}`)
            .then((img) => {
              if (id === runId.current) dispatch({ type: 'setAfter', image: img })
              else {
                img.bitmap.close()
                URL.revokeObjectURL(img.url)
              }
            })
            .catch(() => toast.error('Enhancement failed', { description: 'Try a smaller image.' }))
        }
        w.addEventListener('message', onMessage)
        const request: EnhanceRequest = {
          id,
          buffer: pixels.data.slice().buffer,
          width: pixels.width,
          height: pixels.height,
          params: enhance,
        }
        w.postMessage(request, [request.buffer])
      } catch {
        toast.error('Enhancement failed', { description: 'Your browser could not process this image.' })
      }
    }, delay)
    return () => {
      clearTimeout(timer)
      // Invalidate in-flight work, including when enhance mode is left.
      runId.current++
    }
    // `state.after` is intentionally omitted: only edits or a new photo should trigger a run.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [enhanceMode, before, enhance, dispatch])
}
