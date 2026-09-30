import { useEffect, useRef, type CSSProperties, type RefObject, type Dispatch, type PointerEvent, type TouchEvent } from 'react'
import type { Action, CompareState } from '@/lib/compare-state'
import { filterString } from '@/lib/filters'
import { boxAspect, clampPan, contentAspect, cssTransform } from '@/lib/transform'
import { CompareReveal } from '@/components/ui/compare-reveal'

const imgFit = 'h-full w-full object-contain'

export function Viewer({
  state,
  dispatch,
  boxRef,
}: {
  state: CompareState
  dispatch: Dispatch<Action>
  /** Ref to the viewer box, so callers can read its CSS pixel size (used to scale pan on export). */
  boxRef: RefObject<HTMLDivElement | null>
}) {
  const { before, after, mode, view, adjust } = state
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  const space = useRef(false)
  const hover = useRef(false)
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  // Track Space so Space+drag pans; stop the page from scrolling while panning over the viewer.
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isField(e.target)) return
      space.current = true
      if (hover.current && viewRef.current.zoom > 1) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false
    }
    const blur = () => (space.current = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  if (!before || !after) return null

  /** Dispatch a pan delta, clamped so the zoomed image cannot leave the frame. */
  const panBy = (dx: number, dy: number) => {
    const v = viewRef.current
    const box = boxRef.current
    if (v.zoom <= 1 || !box) return
    const next = clampPan({ ...v, panX: v.panX + dx, panY: v.panY + dy }, { w: box.clientWidth, h: box.clientHeight })
    const ddx = next.panX - v.panX
    const ddy = next.panY - v.panY
    if (ddx || ddy) {
      viewRef.current = next
      dispatch({ type: 'pan', dx: ddx, dy: ddy })
    }
  }

  // Capture phase so a pan gesture never reaches the compare slider underneath.
  const onPointerDownCapture = (e: PointerEvent<HTMLDivElement>) => {
    if (viewRef.current.zoom <= 1) return
    if ((e.target as HTMLElement).closest('[role="slider"]')) return
    const middle = e.pointerType === 'mouse' && e.button === 1
    if (!middle && !(space.current && e.button === 0)) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    panBy(e.clientX - d.x, e.clientY - d.y)
    d.x = e.clientX
    d.y = e.clientY
  }
  const endPan = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  const centroid = (e: TouchEvent) => ({
    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
  })
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touch.current = e.touches.length === 2 ? centroid(e) : null
  }
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !touch.current) return
    const c = centroid(e)
    panBy(c.x - touch.current.x, c.y - touch.current.y)
    touch.current = c
  }
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) touch.current = null
  }

  const quarter = view.rotation === 90 || view.rotation === 270
  const ca = contentAspect(mode, before.width, before.height)
  const wrapper: CSSProperties = {
    transform: quarter ? `translate(-50%, -50%) ${cssTransform(view)}` : cssTransform(view),
    filter: filterString(adjust),
    transformOrigin: 'center',
    // At quarter turns the box is height/width; lay the content out at its pre-rotation size
    // (swapped box dimensions) so the rotated content exactly fills the box (contain).
    ...(quarter ? { position: 'absolute', left: '50%', top: '50%', width: `${ca * 100}%`, height: `${100 / ca}%` } : null),
  }
  const aspect: CSSProperties = { aspectRatio: `${before.width} / ${before.height}` }

  return (
    <div
      ref={boxRef}
      className="relative overflow-hidden rounded-xl border"
      style={{
        touchAction: view.zoom > 1 ? 'none' : undefined,
        aspectRatio: quarter ? String(boxAspect(mode, before.width, before.height, view.rotation)) : undefined,
      }}
      data-testid="viewer"
      data-mode={mode}
      onPointerEnter={() => (hover.current = true)}
      onPointerLeave={() => (hover.current = false)}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onAuxClick={(e) => e.button === 1 && e.preventDefault()}
    >
      <div style={wrapper} className="will-change-transform">
        {mode === 'slider' && (
          <CompareReveal
            before={<img src={before.url} alt="Before" draggable={false} className={imgFit} />}
            after={<img src={after.url} alt="After" draggable={false} className={imgFit} />}
            position={state.sliderPct}
            onPositionChange={(v: number) => dispatch({ type: 'set', key: 'sliderPct', value: v })}
            snapOnDoubleClick={50}
            className="aspect-auto rounded-none border-0"
            style={aspect}
          />
        )}
        {mode === 'side' && (
          <div className="grid grid-cols-2 gap-1">
            <img src={before.url} alt="Before" draggable={false} className="w-full object-contain" style={aspect} />
            <img src={after.url} alt="After" draggable={false} className="w-full object-contain" style={aspect} />
          </div>
        )}
        {(mode === 'fade' || mode === 'onion') && (
          <div className="relative" style={aspect}>
            <img src={before.url} alt="Before" draggable={false} className={imgFit} />
            <img
              src={after.url}
              alt="After"
              draggable={false}
              className={`absolute inset-0 ${imgFit}`}
              // Plain alpha, same as the legacy onion view and the render.ts export.
              style={{ opacity: (mode === 'fade' ? state.fadeOpacity : state.onionOpacity) / 100 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
