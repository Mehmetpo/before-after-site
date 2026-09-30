import type { CompareState } from '@/lib/compare-state'
import { frameCount, GIF_FPS, sweepPositions } from '@/lib/gif'
import { renderToCanvas, type BoxSize } from '@/lib/render'

export const GIF_MAX_SIDE = 720

// MessageChannel yields without the >=1s timer clamping browsers apply in background tabs.
const tick = () =>
  new Promise<void>((resolve) => {
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = () => {
      port1.close()
      resolve()
    }
    port2.postMessage(null)
  })

/** Renders the slider sweep and encodes it as a looping GIF. Rejects with an AbortError when cancelled. */
export async function encodeSweepGif(
  state: CompareState,
  seconds: number,
  box: BoxSize | undefined,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const positions = sweepPositions(frameCount(seconds))
  const gif = GIFEncoder()
  const delay = Math.round(1000 / GIF_FPS)
  for (let i = 0; i < positions.length; i++) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    const canvas = renderToCanvas({ ...state, mode: 'slider', sliderPct: positions[i] }, 'snapshot', box, {
      maxSide: GIF_MAX_SIDE,
    })
    if (!canvas) throw new Error('Add both images first.')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Your browser could not create a drawing surface.')
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const palette = quantize(data, 256)
    gif.writeFrame(applyPalette(data, palette), canvas.width, canvas.height, { palette, delay, repeat: 0 })
    canvas.width = canvas.height = 0
    onProgress((i + 1) / positions.length)
    await tick() // keep the page responsive and let Cancel land
  }
  gif.finish()
  return new Blob([gif.bytes()], { type: 'image/gif' })
}
