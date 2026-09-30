import { FileImageIcon } from '@hugeicons/core-free-icons'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { isSafeImageUrl } from '@/lib/embed'
import { parseShareParams } from '@/lib/share'
import { useEnhance } from '@/hooks/useEnhance'
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
  const { state, dispatch, addFiles, startEnhance, loadUrls } = useCompareState()
  useEnhance(state, dispatch)
  const enhanceInput = useRef<HTMLInputElement>(null)
  const [urlA, setUrlA] = useState('')
  const [urlB, setUrlB] = useState('')
  const [loadingUrls, setLoadingUrls] = useState(false)
  const fromLinks = async (a: string, b: string) => {
    setLoadingUrls(true)
    await loadUrls(a, b)
    setLoadingUrls(false)
  }
  // Open a shared link (?a=...&b=...) straight into the comparison.
  useEffect(() => {
    const shared = parseShareParams(window.location.search)
    if (shared) void fromLinks(shared.a, shared.b)
    // Runs once on mount.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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

  const enhancing = state.enhanceMode && Boolean(state.before) && !state.after
  const missing = !state.before ? (state.after ? 'the before image' : 'two images') : 'the after image'

  return (
    <section id="tool" className="mx-auto flex w-full max-w-5xl scroll-mt-6 flex-col gap-6 px-4 py-16">
      {!ready && !enhancing && (
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

      {!ready && !enhancing && (
        <form
          className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (isSafeImageUrl(urlA.trim()) && isSafeImageUrl(urlB.trim())) void fromLinks(urlA.trim(), urlB.trim())
          }}
        >
          <input
            type="url"
            value={urlA}
            onChange={(e) => setUrlA(e.target.value)}
            placeholder="Before image link (https://)"
            aria-label="Before image link"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            type="url"
            value={urlB}
            onChange={(e) => setUrlB(e.target.value)}
            placeholder="After image link (https://)"
            aria-label="After image link"
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" variant="outline" size="sm" className="h-9" disabled={loadingUrls || !isSafeImageUrl(urlA.trim()) || !isSafeImageUrl(urlB.trim())}>
            {loadingUrls ? 'Loading…' : 'Compare links'}
          </Button>
        </form>
      )}

      {!ready && !enhancing && (
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <span>Only have one photo?</span>
          <Button variant="outline" size="sm" onClick={() => enhanceInput.current?.click()}>
            Enhance a single photo
          </Button>
          <input
            ref={enhanceInput}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a photo to enhance"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (files.length) void startEnhance(files)
            }}
          />
        </div>
      )}

      {enhancing && <div className="h-96 animate-pulse rounded-xl border bg-muted/40" aria-busy="true" />}

      {ready && (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border bg-muted/40" aria-busy="true" />}>
          <Workspace state={state} dispatch={dispatch} viewerRef={viewerRef} />
        </Suspense>
      )}
    </section>
  )
}
