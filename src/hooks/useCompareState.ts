import { useCallback, useEffect, useReducer, useRef } from 'react'
import { toast } from 'sonner'
import { ENHANCE_MAX_SIDE } from '@/hooks/useEnhance'
import { trackEvent } from '@/lib/analytics'
import { initialState, reducer } from '@/lib/compare-state'
import { disposeImage, loadImage, selectFiles, type LoadedImage } from '@/lib/image-load'

export function useCompareState() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const live = useRef<LoadedImage[]>([])
  // Batches are applied in call order even if a later batch finishes decoding first,
  // so before/after can never swap.
  const queue = useRef<Promise<void>>(Promise.resolve())

  const loadBatch = useCallback(async (files: File[]) => {
    const { accepted, rejected } = selectFiles(files)
    for (const { file, reason } of rejected) toast.error(file.name, { description: reason })
    const loaded: LoadedImage[] = []
    for (const file of accepted) {
      try {
        const img = await loadImage(file)
        if (img.resizedFrom) {
          toast.info(`${file.name} resized`, {
            description: `${img.resizedFrom.width}x${img.resizedFrom.height} to ${img.width}x${img.height}`,
          })
        }
        loaded.push(img)
      } catch {
        toast.error(file.name, { description: 'This file could not be decoded as an image.' })
      }
    }
    if (loaded.length) {
      dispatch({ type: 'images', images: loaded })
      trackEvent('images_added', { count: loaded.length })
    }
  }, [])

  const addFiles = useCallback(
    (files: File[]) => {
      const next = queue.current.then(() => loadBatch(files))
      queue.current = next.catch(() => {})
      return next
    },
    [loadBatch],
  )

  const startEnhance = useCallback(
    (files: File[]) => {
      const next = queue.current.then(async () => {
        const { accepted, rejected } = selectFiles(files, 1)
        for (const { file, reason } of rejected) toast.error(file.name, { description: reason })
        const [file] = accepted
        if (!file) return
        try {
          const img = await loadImage(file, ENHANCE_MAX_SIDE)
          dispatch({ type: 'enhanceStart', image: img })
          trackEvent('images_added', { count: 1 })
        } catch {
          toast.error(file.name, { description: 'This file could not be decoded as an image.' })
        }
      })
      queue.current = next.catch(() => {})
      return next
    },
    [],
  )

  // Dispose replaced images so bitmaps and object URLs do not leak.
  useEffect(() => {
    const current = [state.before, state.after].filter(Boolean) as LoadedImage[]
    for (const old of live.current) if (!current.includes(old)) disposeImage(old)
    live.current = current
  }, [state.before, state.after])

  useEffect(() => () => live.current.forEach(disposeImage), [])

  return { state, dispatch, addFiles, startEnhance }
}
