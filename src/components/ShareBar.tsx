import { CopySimple, FilmStrip, LinkSimple, X } from '@phosphor-icons/react'
import { useRef, useState, type RefObject } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CompareState } from '@/lib/compare-state'
import { trackEvent } from '@/lib/analytics'
import { downloadBlob } from '@/lib/export'
import { encodeSweepGif } from '@/lib/gif-export'
import { renderToCanvas } from '@/lib/render'
import { buildShareUrl } from '@/lib/share'

const LENGTHS = [2, 4, 6]

/** Share-friendly outputs: copy the current view to the clipboard, or export the slider sweep as a GIF. */
export function ShareBar({ state, boxRef }: { state: CompareState; boxRef: RefObject<HTMLElement | null> }) {
  const [seconds, setSeconds] = useState(4)
  const [progress, setProgress] = useState<number | null>(null)
  const abort = useRef<AbortController | null>(null)
  const box = () => (boxRef.current ? { w: boxRef.current.clientWidth, h: boxRef.current.clientHeight } : undefined)

  const copyImage = async () => {
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('unsupported')
      const canvas = renderToCanvas(state, 'snapshot', box())
      if (!canvas) return toast.error('Add both images first.')
      // Passing a promise keeps Safari happy: the write must start inside the click gesture.
      const blob = new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/png'),
      )
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      canvas.width = canvas.height = 0
      toast.success('Image copied to clipboard')
      trackEvent('share', { kind: 'copy' })
    } catch {
      toast.error('Could not copy the image', { description: 'Your browser may block image copying. Use Snapshot to download it instead.' })
    }
  }

  const shareLink = state.before?.sourceUrl && state.after?.sourceUrl ? buildShareUrl(window.location.origin, state.before.sourceUrl, state.after.sourceUrl) : null
  const copyLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      toast.success('Share link copied')
      trackEvent('share', { kind: 'link' })
    } catch {
      toast.error('Copy failed. Select the link and copy it manually.')
    }
  }

  const exportGif = async () => {
    if (abort.current) return
    const ctrl = new AbortController()
    abort.current = ctrl
    setProgress(0)
    try {
      const blob = await encodeSweepGif(state, seconds, box(), setProgress, ctrl.signal)
      downloadBlob(blob, `before-after-slider-${new Date().toISOString().slice(0, 10)}.gif`)
      toast.success('GIF ready', { description: `${(blob.size / 1024 / 1024).toFixed(1)} MB` })
      trackEvent('share', { kind: 'gif' })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        toast.error('GIF export failed', { description: e instanceof Error ? e.message : 'Try again with a smaller image.' })
      }
    } finally {
      abort.current = null
      setProgress(null)
    }
  }

  const busy = progress !== null
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <Button variant="outline" size="sm" onClick={() => void copyImage()} disabled={busy}>
        <CopySimple />
        Copy image
      </Button>
      {shareLink && (
        <Button variant="outline" size="sm" onClick={() => void copyLink()} disabled={busy}>
          <LinkSimple />
          Copy share link
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <span id="gif-length-label" className="text-xs text-muted-foreground">
          GIF length
        </span>
        <Select value={String(seconds)} onValueChange={(v) => setSeconds(Number(v))} disabled={busy}>
          <SelectTrigger aria-labelledby="gif-length-label" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LENGTHS.map((l) => (
              <SelectItem key={l} value={String(l)}>
                {l} s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {busy ? (
        <Button variant="outline" size="sm" onClick={() => abort.current?.abort()}>
          <X />
          Cancel ({Math.round((progress ?? 0) * 100)}%)
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => void exportGif()}>
          <FilmStrip />
          Export slider GIF
        </Button>
      )}
      <p className="basis-full text-xs text-muted-foreground">
        The GIF sweeps the slider left to right and back, up to {720}px wide. Made entirely in your browser.
      </p>
    </div>
  )
}
