import { ArrowsOut, CircleHalf, Columns, Intersect, SquareSplitHorizontal, Swap, X } from '@phosphor-icons/react'
import { useRef, type Dispatch, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import ExpandingTabs, { type ExpandingTab } from '@/components/ui/expanding-tabs'
import { EnhancePanel } from '@/components/EnhancePanel'
import { ExportBar } from '@/components/ExportBar'
import { Toolbar } from '@/components/Toolbar'
import { Viewer } from '@/components/Viewer'
import { toggleFullscreen } from '@/hooks/useShortcuts'
import type { Action, CompareState, Mode } from '@/lib/compare-state'

const MODE_TABS: ExpandingTab<Mode>[] = [
  { id: 'slider', label: 'Slider', icon: SquareSplitHorizontal },
  { id: 'side', label: 'Side', icon: Columns },
  { id: 'fade', label: 'Fade', icon: CircleHalf },
  { id: 'onion', label: 'Diff', icon: Intersect },
]

/** The compare UI shown once both images are loaded; split out so it loads on demand. */
export default function Workspace({
  state,
  dispatch,
  viewerRef,
}: {
  state: CompareState
  dispatch: Dispatch<Action>
  viewerRef: RefObject<HTMLDivElement | null>
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ExpandingTabs
          tabs={MODE_TABS}
          value={state.mode}
          onChange={(mode) => dispatch({ type: 'mode', mode })}
          aria-label="Comparison mode"
        />
        <div className="flex items-center gap-2">
          {!state.enhanceMode && (
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'swap' })}>
              <Swap />
              Swap
            </Button>
          )}
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
      {state.enhanceMode && <EnhancePanel state={state} dispatch={dispatch} />}
      <Toolbar state={state} dispatch={dispatch} />
      <div ref={viewerRef} className="bg-background">
        <Viewer state={state} dispatch={dispatch} boxRef={boxRef} />
      </div>
      <ExportBar state={state} dispatch={dispatch} boxRef={boxRef} />
      <p className="text-sm text-muted-foreground">
        Shortcuts: 1-4 modes, ←/→ slider, +/- zoom, R rotate, F fullscreen
      </p>
    </>
  )
}
