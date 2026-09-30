import { ArrowCounterClockwise } from '@phosphor-icons/react'
import type { Dispatch } from 'react'
import { SliderRow } from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import type { Action, CompareState } from '@/lib/compare-state'
import { ENHANCE_LIMITS, isNeutralEnhance, type Enhance } from '@/lib/enhance'

const CONTROLS: { key: keyof Enhance; label: string; unit?: string }[] = [
  { key: 'exposure', label: 'Exposure', unit: ' EV' },
  { key: 'hdr', label: 'HDR tone' },
  { key: 'saturation', label: 'Saturation' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'sharpen', label: 'Sharpen' },
  { key: 'denoise', label: 'Denoise' },
]

/** Sliders for single-photo enhance mode; the result feeds the before/after viewer above. */
export function EnhancePanel({ state, dispatch }: { state: CompareState; dispatch: Dispatch<Action> }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Enhance your photo</h3>
          <p className="text-xs text-muted-foreground">
            Edits run in your browser. Drag the slider above to compare with the original.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isNeutralEnhance(state.enhance)}
          onClick={() => dispatch({ type: 'enhanceReset' })}
        >
          <ArrowCounterClockwise />
          Reset
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {CONTROLS.map(({ key, label, unit }) => (
          <SliderRow
            key={key}
            label={label}
            value={state.enhance[key]}
            {...ENHANCE_LIMITS[key]}
            unit={unit ?? ''}
            onChange={(value) => dispatch({ type: 'enhanceSet', key, value })}
          />
        ))}
      </div>
    </div>
  )
}
