import { useId, useState, type Dispatch } from 'react'
import { Slider } from '@/components/ui/slider'
import { Pattern as EditToolbar } from '@/components/ui/v-toolbar-3'
import type { Action, CompareState } from '@/lib/compare-state'

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (value: number) => void
}

function SliderRow({ label, value, min, max, unit = '%', onChange }: SliderRowProps) {
  const id = useId()
  return (
    <div className="flex min-w-44 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span id={id}>{label}</span>
        <span className="tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        aria-labelledby={id}
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

export function Toolbar({ state, dispatch }: { state: CompareState; dispatch: Dispatch<Action> }) {
  const [adjustOpen, setAdjustOpen] = useState(true)
  const { mode, adjust } = state
  const opacityKey = mode === 'fade' ? 'fadeOpacity' : mode === 'onion' ? 'onionOpacity' : null

  return (
    <div className="flex flex-col gap-3">
      <EditToolbar
        aria-label="View controls"
        onRotateLeft={() => dispatch({ type: 'rotate', deg: -90 })}
        onRotateRight={() => dispatch({ type: 'rotate', deg: 90 })}
        onZoomOut={() => dispatch({ type: 'zoom', factor: 0.8 })}
        onZoomIn={() => dispatch({ type: 'zoom', factor: 1.25 })}
        onFit={() => dispatch({ type: 'resetView' })}
        adjustmentsOpen={adjustOpen}
        onAdjustments={() => setAdjustOpen((o) => !o)}
        // No onExport: the export bar sits right below, and the extra button overflows 375px screens.
      />
      {adjustOpen && (
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <SliderRow
            label="Brightness"
            value={adjust.brightness}
            min={0}
            max={200}
            onChange={(value) => dispatch({ type: 'adjust', key: 'brightness', value })}
          />
          <SliderRow
            label="Contrast"
            value={adjust.contrast}
            min={0}
            max={200}
            onChange={(value) => dispatch({ type: 'adjust', key: 'contrast', value })}
          />
          {opacityKey && (
            <SliderRow
              label={mode === 'fade' ? 'Fade' : 'Onion opacity'}
              value={state[opacityKey]}
              min={0}
              max={100}
              onChange={(value) => dispatch({ type: 'set', key: opacityKey, value })}
            />
          )}
        </div>
      )}
    </div>
  )
}
