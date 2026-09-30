import { FileImageIcon } from '@hugeicons/core-free-icons'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { useCompareState } from '@/hooks/useCompareState'
import { trackEvent } from '@/lib/analytics'
import { usePasteImages } from '@/hooks/usePasteImages'
import { useShortcuts } from '@/hooks/useShortcuts'

const Workspace = lazy(() => import('@/components/Workspace'))

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif'

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
  useEffect(() => {
    if (ready) trackEvent('compare_ready')
  }, [ready])
  useEffect(() => {
    if (ready) trackEvent('mode_change', { mode: state.mode })
  }, [ready, state.mode])

  const missing = !state.before ? (state.after ? 'the before image' : 'two images') : 'the after image'

  return (
    <section id="tool" className="mx-auto flex w-full max-w-5xl scroll-mt-6 flex-col gap-6 px-4 py-16">
      {!ready && (
        <FileUpload
          accept={IMAGE_ACCEPT}
          acceptedFileTypes={UPLOAD_ICONS}
          multiple
          // Let unsupported files (e.g. HEIC) reach validateFile so it can explain why.
          filterByAccept={false}
          showFileList={false}
          title={`Drop ${missing} here, or click to upload`}
          description="PNG, JPG, WebP, GIF or AVIF. You can also paste from the clipboard."
          browseLabel="Browse images"
          draggingLabel="Drop to compare"
          onFilesAccepted={addFiles}
        />
      )}

      {ready && (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border bg-muted/40" aria-busy="true" />}>
          <Workspace state={state} dispatch={dispatch} viewerRef={viewerRef} />
        </Suspense>
      )}
    </section>
  )
}
