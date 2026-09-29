import { ArrowsOut, CircleHalf, Columns, Intersect, SquareSplitHorizontal, Swap, X } from '@phosphor-icons/react'
import { FileImageIcon } from '@hugeicons/core-free-icons'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import ExpandingTabs, { type ExpandingTab } from '@/components/ui/expanding-tabs'
import { FileUpload } from '@/components/ui/file-upload'
import { ExportBar } from '@/components/ExportBar'
import { Toolbar } from '@/components/Toolbar'
import { Viewer } from '@/components/Viewer'
import { useCompareState } from '@/hooks/useCompareState'
import { usePasteImages } from '@/hooks/usePasteImages'
import { toggleFullscreen, useShortcuts } from '@/hooks/useShortcuts'
import type { Mode } from '@/lib/compare-state'

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif'

const MODE_TABS: ExpandingTab<Mode>[] = [
  { id: 'slider', label: 'Slider', icon: SquareSplitHorizontal },
  { id: 'side', label: 'Side', icon: Columns },
  { id: 'fade', label: 'Fade', icon: CircleHalf },
  { id: 'onion', label: 'Onion', icon: Intersect },
]

const UPLOAD_ICONS = [
  { label: 'Before', icon: FileImageIcon },
  { label: 'Image', icon: FileImageIcon },
  { label: 'After', icon: FileImageIcon },
]

export function Tool() {
  const { state, dispatch, addFiles } = useCompareState()
  usePasteImages(addFiles)
  const viewerRef = useRef<HTMLDivElement>(null)
  useShortcuts(state, dispatch, viewerRef)

  const ready = Boolean(state.before && state.after)
  const missing = !state.before ? (state.after ? 'the before image' : 'two images') : 'the after image'

  return (
    <section id="tool" className="mx-auto flex w-full max-w-5xl scroll-mt-6 flex-col gap-6 px-4 py-16">
      {!ready && (
        <FileUpload
          accept={IMAGE_ACCEPT}
          acceptedFileTypes={UPLOAD_ICONS}
          multiple
          showFileList={false}
          title={`Drop ${missing} here, or click to upload`}
          description="PNG, JPG, WebP, GIF or AVIF. You can also paste from the clipboard."
          browseLabel="Browse images"
          draggingLabel="Drop to compare"
          onFilesAccepted={addFiles}
        />
      )}

      {ready && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ExpandingTabs
              tabs={MODE_TABS}
              value={state.mode}
              onChange={(mode) => dispatch({ type: 'mode', mode })}
              aria-label="Comparison mode"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'swap' })}>
                <Swap />
                Swap
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleFullscreen(viewerRef.current)}>
                <ArrowsOut />
                Fullscreen
              </Button>
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'clear' })}>
                <X />
                Clear
              </Button>
            </div>
          </div>
          <Toolbar state={state} dispatch={dispatch} />
          <div ref={viewerRef} className="bg-background">
            <Viewer state={state} dispatch={dispatch} />
          </div>
          <ExportBar state={state} dispatch={dispatch} />
          <p className="text-sm text-muted-foreground">
            Shortcuts: 1-4 modes, ←/→ slider, +/- zoom, R rotate, F fullscreen
          </p>
        </>
      )}
    </section>
  )
}
