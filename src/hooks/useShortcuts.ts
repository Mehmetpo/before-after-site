import { useEffect, useRef, type Dispatch, type RefObject } from 'react'
import type { Action, CompareState, Mode } from '@/lib/compare-state'

const MODES: Mode[] = ['slider', 'side', 'fade', 'onion']
// Legacy stepped the slider by 0.02 of its range on a 0..1 scale; state is 0..100 here.
const SLIDER_STEP = 2
const ZOOM_STEP = 1.15

function isEditable(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
}

export function toggleFullscreen(el: HTMLElement | null) {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void el?.requestFullscreen?.().catch(() => {})
}

/** Global keyboard shortcuts for the compare tool. Inactive until both images are loaded. */
export function useShortcuts(
  state: CompareState,
  dispatch: Dispatch<Action>,
  viewerRef: RefObject<HTMLElement | null>,
) {
  const ready = Boolean(state.before && state.after)
  const latest = useRef({ mode: state.mode, sliderPct: state.sliderPct })
  useEffect(() => {
    latest.current = { mode: state.mode, sliderPct: state.sliderPct }
  }, [state.mode, state.sliderPct])

  useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return
      const { mode, sliderPct } = latest.current
      if (e.key >= '1' && e.key <= '4') {
        dispatch({ type: 'mode', mode: MODES[Number(e.key) - 1] })
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && mode === 'slider') {
        // The focused slider handle steps itself; do not double-move it.
        if (e.target instanceof HTMLElement && e.target.closest('[role="slider"]')) return
        const next = sliderPct + (e.key === 'ArrowRight' ? SLIDER_STEP : -SLIDER_STEP)
        dispatch({ type: 'set', key: 'sliderPct', value: Math.min(99, Math.max(1, next)) })
      } else if (e.key === '+' || e.key === '=') {
        dispatch({ type: 'zoom', factor: ZOOM_STEP })
      } else if (e.key === '-') {
        dispatch({ type: 'zoom', factor: 1 / ZOOM_STEP })
      } else if (e.key === 'r' || e.key === 'R') {
        dispatch({ type: 'rotate', deg: 90 })
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen(viewerRef.current)
      } else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ready, dispatch, viewerRef])
}
