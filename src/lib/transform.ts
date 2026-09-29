export interface View {
  zoom: number
  panX: number
  panY: number
  rotation: 0 | 90 | 180 | 270
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 8
export const DEFAULT_VIEW: View = { zoom: 1, panX: 0, panY: 0, rotation: 0 }

export function clampPan(v: View, box: { w: number; h: number }): View {
  const maxX = ((v.zoom - 1) * box.w) / 2
  const maxY = ((v.zoom - 1) * box.h) / 2
  return {
    ...v,
    panX: Math.min(maxX, Math.max(-maxX, v.panX)),
    panY: Math.min(maxY, Math.max(-maxY, v.panY)),
  }
}

export function zoomBy(v: View, factor: number): View {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor))
  if (zoom === MIN_ZOOM) return { ...v, zoom, panX: 0, panY: 0 }
  return { ...v, zoom }
}

export function rotateBy(v: View, deg: 90 | -90): View {
  const rotation = ((((v.rotation + deg) % 360) + 360) % 360) as View['rotation']
  return { ...v, rotation }
}

export function cssTransform(v: View): string {
  return `translate(${v.panX}px, ${v.panY}px) rotate(${v.rotation}deg) scale(${v.zoom})`
}
