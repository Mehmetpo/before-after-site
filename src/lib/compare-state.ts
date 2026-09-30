import { clampEnhance, NEUTRAL_ENHANCE, type Enhance } from '@/lib/enhance'
import { clampPct, NEUTRAL_ADJUST, type Adjust } from '@/lib/filters'
import type { LoadedImage } from '@/lib/image-load'
import { DEFAULT_VIEW, rotateBy, zoomBy, type View } from '@/lib/transform'

export type Mode = 'slider' | 'side' | 'fade' | 'onion'
export type Format = 'png' | 'jpeg' | 'webp'

export interface CompareState {
  before: LoadedImage | null
  after: LoadedImage | null
  mode: Mode
  sliderPct: number
  fadeOpacity: number
  onionOpacity: number
  view: View
  adjust: Adjust
  /** Single-photo mode: `after` is generated from `before` by the enhancement settings. */
  enhanceMode: boolean
  enhance: Enhance
  format: Format
  quality: number
}

export const initialState: CompareState = {
  before: null,
  after: null,
  mode: 'slider',
  sliderPct: 50,
  fadeOpacity: 50,
  onionOpacity: 100,
  view: DEFAULT_VIEW,
  adjust: NEUTRAL_ADJUST,
  enhanceMode: false,
  enhance: NEUTRAL_ENHANCE,
  format: 'png',
  quality: 92,
}

type PctKey = 'sliderPct' | 'fadeOpacity' | 'onionOpacity'

export type Action =
  | { type: 'images'; images: LoadedImage[] }
  | { type: 'swap' }
  | { type: 'clear' }
  | { type: 'mode'; mode: Mode }
  | { type: 'set'; key: PctKey; value: number }
  | { type: 'adjust'; key: keyof Adjust; value: number }
  | { type: 'enhanceStart'; image: LoadedImage }
  | { type: 'enhanceSet'; key: keyof Enhance; value: number }
  | { type: 'enhanceReset' }
  | { type: 'setAfter'; image: LoadedImage }
  | { type: 'zoom'; factor: number }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'rotate'; deg: 90 | -90 }
  | { type: 'resetView' }
  | { type: 'format'; format: Format }
  | { type: 'quality'; value: number }

const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v)))

export function reducer(s: CompareState, a: Action): CompareState {
  switch (a.type) {
    case 'images': {
      const [first, second] = a.images
      // Uploading real images always leaves enhance mode.
      if (first && second) return { ...s, before: first, after: second, enhanceMode: false }
      if (first && !s.before) return { ...s, before: first, enhanceMode: false }
      if (first) return { ...s, after: first, enhanceMode: false }
      return s
    }
    case 'swap':
      return { ...s, before: s.after, after: s.before }
    case 'clear':
      return { ...s, before: null, after: null, view: DEFAULT_VIEW, enhanceMode: false, enhance: NEUTRAL_ENHANCE }
    case 'mode':
      return { ...s, mode: a.mode }
    case 'set':
      return { ...s, [a.key]: pct(a.value) }
    case 'adjust':
      return { ...s, adjust: { ...s.adjust, [a.key]: clampPct(a.value) } }
    case 'enhanceStart':
      return { ...s, before: a.image, after: null, enhanceMode: true, enhance: NEUTRAL_ENHANCE, view: DEFAULT_VIEW }
    case 'enhanceSet':
      return { ...s, enhance: { ...s.enhance, [a.key]: clampEnhance(a.key, a.value) } }
    case 'enhanceReset':
      return { ...s, enhance: NEUTRAL_ENHANCE }
    case 'setAfter':
      return { ...s, after: a.image }
    case 'zoom':
      return { ...s, view: zoomBy(s.view, a.factor) }
    case 'pan':
      return s.view.zoom > 1
        ? { ...s, view: { ...s.view, panX: s.view.panX + a.dx, panY: s.view.panY + a.dy } }
        : s
    case 'rotate':
      return { ...s, view: rotateBy(s.view, a.deg) }
    case 'resetView':
      return { ...s, view: DEFAULT_VIEW }
    case 'format':
      return { ...s, format: a.format }
    case 'quality':
      return { ...s, quality: Math.min(100, Math.max(1, Math.round(a.value))) }
  }
}
