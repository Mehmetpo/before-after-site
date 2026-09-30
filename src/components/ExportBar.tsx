import { useEffect, useRef, useState, type Dispatch, type RefObject } from 'react'
import { toast } from 'sonner'
import DownloadButton from '@/components/ui/button-download'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Action, CompareState, Format } from '@/lib/compare-state'
import { trackEvent } from '@/lib/analytics'
import { buildFilename, canvasToBlob, downloadBlob } from '@/lib/export'
import { renderToCanvas, type ExportKind } from '@/lib/render'

type Status = 'idle' | 'downloading' | 'downloaded' | 'complete'

const FORMATS: { value: Format; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

// Next paint, with a timeout fallback because rAF is paused in background tabs.
const nextFrame = () =>
  new Promise<void>((r) => {
    requestAnimationFrame(() => r())
    setTimeout(r, 50)
  })

export function ExportBar({
  state,
  dispatch,
  boxRef,
}: {
  state: CompareState
  dispatch: Dispatch<Action>
  boxRef: RefObject<HTMLElement | null>
}) {
  const [busy, setBusy] = useState<ExportKind | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const timers = useRef<number[]>([])
  // Latest values for the toast Retry action, which outlives the render that created it.
  const stateRef = useRef(state)
  const busyRef = useRef<ExportKind | null>(null)
  const runRef = useRef<(kind: ExportKind) => Promise<void>>(async () => {})

  useEffect(() => {
    stateRef.current = state
  })
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const reset = () => {
    busyRef.current = null
    setBusy(null)
    setStatus('idle')
    setProgress(0)
  }

  const run = async (kind: ExportKind) => {
    if (busyRef.current) return
    busyRef.current = kind
    setBusy(kind)
    setStatus('downloading')
    setProgress(10)
    // Let the button paint its progress state before the synchronous canvas work.
    await nextFrame()
    const current = stateRef.current
    try {
      const canvas = renderToCanvas(
        current,
        kind,
        boxRef.current ? { w: boxRef.current.clientWidth, h: boxRef.current.clientHeight } : undefined,
      )
      if (!canvas) {
        reset()
        toast.error('Add both images first.')
        return
      }
      setProgress(60)
      let blob: Blob
      try {
        blob = await canvasToBlob(canvas, current.format, current.quality)
      } finally {
        // Release the backing store now rather than waiting for GC.
        canvas.width = 0
        canvas.height = 0
      }
      setProgress(100)
      downloadBlob(blob, buildFilename(kind, current.format))
      trackEvent('export', { kind, format: current.format })
      later(250, () => setStatus('downloaded'))
      later(1450, () => setStatus('complete'))
      later(1750, reset)
    } catch (e) {
      reset()
      toast.error('Export failed', {
        description: `${e instanceof Error ? e.message : 'Something went wrong.'} Try again, or pick a smaller image or another format.`,
        action: { label: 'Retry', onClick: () => void runRef.current(kind) },
      })
    }
  }

  useEffect(() => {
    runRef.current = run
  })

  const statusFor = (kind: ExportKind): Status => (busy === kind ? status : 'idle')
  const lossy = state.format !== 'png'

  return (
    <div id="export-bar" className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <div className="flex flex-col gap-2">
        <span id="export-format-label" className="text-xs text-muted-foreground">
          Format
        </span>
        <Select value={state.format} onValueChange={(f) => dispatch({ type: 'format', format: f as Format })}>
          <SelectTrigger aria-labelledby="export-format-label" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lossy && (
        <div className="flex min-w-44 flex-1 flex-col gap-2 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span id="export-quality-label">Quality</span>
            <span className="tabular-nums">{state.quality}%</span>
          </div>
          <Slider
            aria-labelledby="export-quality-label"
            min={1}
            max={100}
            step={1}
            value={[state.quality]}
            onValueChange={([value]) => dispatch({ type: 'quality', value })}
          />
        </div>
      )}

      <div className="ml-auto flex flex-wrap gap-3">
        <DownloadButton
          label="Combined"
          downloadStatus={statusFor('combined')}
          progress={busy === 'combined' ? progress : 0}
          disabled={busy === 'snapshot'}
          onClick={() => void run('combined')}
        />
        <DownloadButton
          label="Snapshot"
          downloadStatus={statusFor('snapshot')}
          progress={busy === 'snapshot' ? progress : 0}
          disabled={busy === 'combined'}
          onClick={() => void run('snapshot')}
        />
      </div>
    </div>
  )
}
