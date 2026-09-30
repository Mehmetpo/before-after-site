import type { CompareState } from '@/lib/compare-state'
import { filterString } from '@/lib/filters'

export type ExportKind = 'combined' | 'snapshot'

export interface Layer {
  which: 'before' | 'after'
  dx: number
  dy: number
  dw: number
  dh: number
  alpha: number
  clip?: { x: number; y: number; w: number; h: number }
}

export interface ExportPlan {
  width: number
  height: number
  layers: Layer[]
  filter: string
  rotation: 0 | 90 | 180 | 270
  zoom: number
  panX: number
  panY: number
  /** Size of the content before rotation. */
  contentW: number
  contentH: number
}

function fit(srcW: number, srcH: number, cellW: number, cellH: number) {
  const k = Math.min(cellW / srcW, cellH / srcH)
  return { w: Math.round(srcW * k), h: Math.round(srcH * k) }
}

/** Viewer box size in CSS px; view pan is expressed in these units. */
export interface BoxSize {
  w: number
  h: number
}

export function planExport(s: CompareState, kind: ExportKind, box?: BoxSize): ExportPlan | null {
  if (!s.before || !s.after) return null
  const cw = s.before.width
  const ch = s.before.height
  const b = fit(s.before.width, s.before.height, cw, ch)
  const a = fit(s.after.width, s.after.height, cw, ch)
  const sideBySide = kind === 'combined' || s.mode === 'side'

  let layers: Layer[]
  let contentW = cw
  const contentH = ch

  if (sideBySide) {
    contentW = cw * 2
    layers = [
      { which: 'before', dx: (cw - b.w) / 2, dy: (ch - b.h) / 2, dw: b.w, dh: b.h, alpha: 1 },
      { which: 'after', dx: cw + (cw - a.w) / 2, dy: (ch - a.h) / 2, dw: a.w, dh: a.h, alpha: 1 },
    ]
  } else {
    const beforeLayer: Layer = { which: 'before', dx: (cw - b.w) / 2, dy: (ch - b.h) / 2, dw: b.w, dh: b.h, alpha: 1 }
    const afterBase = { which: 'after' as const, dx: (cw - a.w) / 2, dy: (ch - a.h) / 2, dw: a.w, dh: a.h }
    if (s.mode === 'slider') {
      const x = Math.round((cw * s.sliderPct) / 100)
      layers = [beforeLayer, { ...afterBase, alpha: 1, clip: { x, y: 0, w: cw - x, h: ch } }]
    } else if (s.mode === 'fade') {
      layers = [beforeLayer, { ...afterBase, alpha: s.fadeOpacity / 100 }]
    } else {
      layers = [beforeLayer, { ...afterBase, alpha: s.onionOpacity / 100 }]
    }
  }

  const quarter = s.view.rotation === 90 || s.view.rotation === 270
  const width = quarter ? contentH : contentW
  const height = quarter ? contentW : contentH
  // Pan is CSS px in the viewer box; the box shows the whole output, so scale by output/box.
  const kx = box && box.w > 0 ? width / box.w : 1
  const ky = box && box.h > 0 ? height / box.h : 1
  return {
    width,
    height,
    layers,
    filter: filterString(s.adjust),
    rotation: s.view.rotation,
    zoom: kind === 'snapshot' ? s.view.zoom : 1,
    panX: kind === 'snapshot' ? s.view.panX * kx : 0,
    panY: kind === 'snapshot' ? s.view.panY * ky : 0,
    contentW,
    contentH,
  }
}

export function drawPlan(
  ctx: CanvasRenderingContext2D,
  plan: ExportPlan,
  images: { before: CanvasImageSource; after: CanvasImageSource },
): void {
  ctx.save()
  ctx.filter = plan.filter
  ctx.translate(plan.width / 2 + plan.panX, plan.height / 2 + plan.panY)
  ctx.rotate((plan.rotation * Math.PI) / 180)
  ctx.scale(plan.zoom, plan.zoom)
  ctx.translate(-plan.contentW / 2, -plan.contentH / 2)
  for (const l of plan.layers) {
    ctx.save()
    if (l.clip) {
      ctx.beginPath()
      ctx.rect(l.clip.x, l.clip.y, l.clip.w, l.clip.h)
      ctx.clip()
    }
    ctx.globalAlpha = l.alpha
    ctx.drawImage(images[l.which], l.dx, l.dy, l.dw, l.dh)
    ctx.restore()
  }
  ctx.restore()
}

export function renderToCanvas(s: CompareState, kind: ExportKind, box?: BoxSize): HTMLCanvasElement | null {
  const plan = planExport(s, kind, box)
  if (!plan || !s.before || !s.after) return null
  const canvas = document.createElement('canvas')
  canvas.width = plan.width
  canvas.height = plan.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  drawPlan(ctx, plan, { before: s.before.bitmap, after: s.after.bitmap })
  return canvas
}
