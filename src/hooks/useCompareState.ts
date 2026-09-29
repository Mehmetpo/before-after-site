import { useCallback, useEffect, useReducer, useRef } from 'react'
import { toast } from 'sonner'
import { initialState, reducer } from '@/lib/compare-state'
import { disposeImage, loadImage, validateFile, type LoadedImage } from '@/lib/image-load'

export function useCompareState() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const live = useRef<LoadedImage[]>([])

  const addFiles = useCallback(async (files: File[]) => {
    const loaded: LoadedImage[] = []
    for (const file of files.slice(0, 2)) {
      const v = validateFile(file)
      if (!v.ok) {
        toast.error(file.name, { description: v.reason })
        continue
      }
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
    if (loaded.length) dispatch({ type: 'images', images: loaded })
  }, [])

  // Dispose replaced images so bitmaps and object URLs do not leak.
  useEffect(() => {
    const current = [state.before, state.after].filter(Boolean) as LoadedImage[]
    for (const old of live.current) if (!current.includes(old)) disposeImage(old)
    live.current = current
  }, [state.before, state.after])

  useEffect(() => () => live.current.forEach(disposeImage), [])

  return { state, dispatch, addFiles }
}
