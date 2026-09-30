import { useState, type Dispatch } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Action, Align, CompareState } from '@/lib/compare-state'
import { diffPixels, psnr, ssim } from '@/lib/metrics'

const MEASURE_SIDE = 1024

interface Result {
  psnr: number
  ssim: number
  a: Uint8ClampedArray
  b: Uint8ClampedArray
}

function pixels(state: CompareState): Result | null {
  const { before, after, align } = state
  if (!before || !after) return null
  const k = Math.min(1, MEASURE_SIDE / Math.max(before.width, before.height))
  const w = Math.max(1, Math.round(before.width * k))
  const h = Math.max(1, Math.round(before.height * k))
  const grab = (bmp: ImageBitmap, stretch: boolean) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas')
    const fit = stretch ? 1 : Math.min(w / bmp.width, h / bmp.height)
    const dw = stretch ? w : bmp.width * fit
    const dh = stretch ? h : bmp.height * fit
    ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh)
    const d = ctx.getImageData(0, 0, w, h).data
    c.width = c.height = 0
    return d
  }
  const a = grab(before.bitmap, false)
  const b = grab(after.bitmap, align === 'stretch')
  return { psnr: psnr(a, b), ssim: ssim(a, b, w, h), a, b }
}

const ALIGN_LABEL: Record<Align, string> = { fit: 'Fit (keep ratio)', stretch: 'Stretch to match' }

/** How similar the two images are (PSNR, SSIM, changed-pixel share) plus size-mismatch handling. */
export function CompareStats({ state, dispatch }: { state: CompareState; dispatch: Dispatch<Action> }) {
  const [result, setResult] = useState<Result | null>(null)
  const [threshold, setThreshold] = useState(10)
  const [error, setError] = useState(false)
  const { before, after } = state
  if (!before || !after) return null
  const mismatch = before.width !== after.width || before.height !== after.height

  const measure = () => {
    try {
      setError(false)
      setResult(pixels(state))
    } catch {
      setError(true)
    }
  }
  const changed = result ? diffPixels(result.a, result.b, threshold) : 0

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Compare details</h3>
        <Button variant="outline" size="sm" onClick={measure}>
          {result ? 'Measure again' : 'Measure similarity'}
        </Button>
      </div>
      {mismatch && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Sizes differ: {before.width}×{before.height} vs {after.width}×{after.height}.
          </span>
          <Select
            value={state.align}
            onValueChange={(v) => {
              dispatch({ type: 'align', align: v as Align })
              setResult(null)
            }}
          >
            <SelectTrigger aria-label="Size mismatch handling" className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ALIGN_LABEL) as Align[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {ALIGN_LABEL[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {error && <p className="text-xs text-destructive">Could not measure these images.</p>}
      {result && (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">SSIM (1 = identical)</dt>
              <dd className="text-lg font-semibold tabular-nums">{result.ssim.toFixed(3)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">PSNR</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {Number.isFinite(result.psnr) ? `${result.psnr.toFixed(1)} dB` : 'identical'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pixels changed by more than {threshold}/255</dt>
              <dd className="text-lg font-semibold tabular-nums">{(changed * 100).toFixed(1)}%</dd>
            </div>
          </dl>
          <div className="flex max-w-sm flex-col gap-2">
            <span id="diff-threshold-label" className="text-xs text-muted-foreground">
              Change threshold
            </span>
            <Slider
              aria-labelledby="diff-threshold-label"
              min={0}
              max={100}
              step={1}
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Measured on the full images at up to {MEASURE_SIDE}px, ignoring zoom and adjustments.</p>
        </>
      )}
    </div>
  )
}
