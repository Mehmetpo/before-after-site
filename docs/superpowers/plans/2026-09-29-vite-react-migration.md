# Vite + React Migration (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file `index.html` before/after tool with a Vite + React + TypeScript + Tailwind + shadcn app whose UI comes from 21st.dev components, with the known export/UX bugs fixed.

**Architecture:** Pure, unit-tested logic lives in `src/lib/` (no React). `src/hooks/` wraps it for React. `src/components/ui/` holds components installed from 21st.dev / shadcn (never hand-designed). `src/components/` holds thin composition wrappers only. One render pipeline (`lib/render.ts`) produces every export.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest, `motion`, `framer-motion`, `next-themes`, `clsx`, `tailwind-merge`, `border-beam`, `@hugeicons/*`, `@phosphor-icons/react`.

**Spec:** `docs/superpowers/specs/2026-09-29-vite-react-migration-design.md`

**Global rules that apply to every task**
- UI is NOT hand-designed. Visual components come from 21st.dev via `get_component` (MCP server `f89af618-7ede-49e7-add4-58da261e6961`; never `generate`). Install with `npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"` so helper files and dependencies come along. If no API key is available in the shell, fetch the source with `get_component` and write the files the shadcn command would have written, plus install the listed dependencies.
- Check library docs with context7 (`resolve-library-id`, then `query-docs`) before writing config for Vite, Tailwind, shadcn, Vitest, motion, next-themes.
- All `.md` files are written in English.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Shell is Git Bash on Windows; paths use forward slashes.

## File Structure

```
index.html                     Vite entry (new)
legacy/index.html              old site, moved with git mv (deleted in Task 18)
vite.config.ts, vitest config  build + test config
components.json                shadcn config
src/main.tsx                   React root + ThemeProvider
src/index.css                  Tailwind import + shadcn tokens
src/App.tsx                    Hero, Tool, Footer
src/lib/filters.ts             brightness/contrast -> CSS filter string
src/lib/transform.ts           zoom/pan/rotate math
src/lib/compare-state.ts       state shape + reducer
src/lib/image-load.ts          validation, downscale math, File -> LoadedImage
src/lib/render.ts              layout plan (pure) + canvas draw
src/lib/export.ts              mime/ext/filename, toBlob, download
src/lib/samples.ts             hero sample pair metadata
src/hooks/useCompareState.ts   reducer + image loading + toasts
src/hooks/usePasteImages.ts    clipboard paste
src/components/Tool.tsx        upload + tabs + viewer + toolbar + export bar
src/components/Viewer.tsx      picks the view for the active mode
src/components/Toolbar.tsx     zoom/rotate/brightness/contrast/opacity controls
src/components/ExportBar.tsx   format, quality, combined, snapshot
src/components/Hero.tsx        wraps PanoramicSpreadHero with sample data
src/components/SiteFooter.tsx  wraps RuixenGradientFooter + legal modals
src/components/LegalDialogs.tsx About / Terms / Privacy dialogs
src/components/ui/*            21st.dev + shadcn components (generated)
tests/lib/*.test.ts            unit tests
tests/fixtures/                test_before.png, test_after.png
public/samples/                16 WebP files + CREDITS.md (already in repo working tree)
```

---

### Task 1: Housekeeping and sample images

**Files:**
- Modify: `.gitignore`
- Move: `test_before.png`, `test_after.png` to `tests/fixtures/`
- Add: `public/samples/*.webp`, `public/samples/CREDITS.md`

- [ ] **Step 1: Update `.gitignore`**

Replace the file content with:

```
.vercel
node_modules
dist
public/samples/raw/
*.local
```

- [ ] **Step 2: Move fixtures and old site**

```bash
mkdir -p tests/fixtures legacy
git mv test_before.png tests/fixtures/before.png
git mv test_after.png tests/fixtures/after.png
git mv index.html legacy/index.html
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: move old site to legacy/, add NASA sample images and fixtures

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Expected: `git status` clean; `public/samples/` has 16 `.webp` files plus `CREDITS.md`.

---

### Task 2: Scaffold Vite + React + TS

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold in a scratch folder, then copy up**

```bash
npm create vite@latest scaffold-tmp -- --template react-ts
cp -r scaffold-tmp/. .
rm -rf scaffold-tmp README.md src/App.css src/assets public/vite.svg
npm install
```

Note: `cp -r scaffold-tmp/. .` must not overwrite `.gitignore` from Task 1; if it did, restore it with `git checkout .gitignore`.

- [ ] **Step 2: Add Tailwind v4 and path alias**

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

Write `vite.config.ts`:

```ts
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
```

In `tsconfig.json` and `tsconfig.app.json` add under `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

Write `src/index.css`:

```css
@import "tailwindcss";
```

Write `src/App.tsx`:

```tsx
export default function App() {
  return <main className="p-8">Before &amp; After</main>
}
```

Ensure `src/main.tsx` imports `./index.css`.

- [ ] **Step 3: Install Vitest and add scripts**

```bash
npm install -D vitest
```

In `package.json` scripts add `"test": "vitest run"` and `"typecheck": "tsc -b --noEmit"`.

- [ ] **Step 4: Verify build and tests runner**

```bash
npm run build
npx vitest run --passWithNoTests
```

Expected: build succeeds, vitest exits 0.

- [ ] **Step 5: Fix launch config**

Write `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev", "--", "--port", "5173"],
      "port": 5173
    }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: shadcn init

**Files:**
- Create: `components.json`, `src/lib/utils.ts`; modify `src/index.css`

- [ ] **Step 1: Init**

Look up current shadcn Vite instructions with context7, then:

```bash
npx shadcn@latest init
```

Choose: style default/new-york, base color neutral, CSS variables yes. Confirm `components.json` aliases point at `@/components`, `@/lib/utils`.

- [ ] **Step 2: Add primitives used later**

```bash
npx shadcn@latest add button slider dialog select sonner tooltip
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: success. `src/lib/utils.ts` exports `cn`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: init shadcn/ui with base primitives

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `lib/filters.ts` (TDD)

**Files:**
- Create: `src/lib/filters.ts`
- Test: `tests/lib/filters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { clampPct, filterString } from '@/lib/filters'

describe('filters', () => {
  it('returns "none" for neutral values', () => {
    expect(filterString({ brightness: 100, contrast: 100 })).toBe('none')
  })
  it('builds a css filter string', () => {
    expect(filterString({ brightness: 120, contrast: 80 })).toBe(
      'brightness(120%) contrast(80%)',
    )
  })
  it('clamps to 0..200 and rounds', () => {
    expect(clampPct(-5)).toBe(0)
    expect(clampPct(250)).toBe(200)
    expect(clampPct(99.6)).toBe(100)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/filters.test.ts`
Expected: FAIL, cannot resolve `@/lib/filters`.

- [ ] **Step 3: Implement**

```ts
export interface Adjust {
  brightness: number
  contrast: number
}

export const NEUTRAL_ADJUST: Adjust = { brightness: 100, contrast: 100 }

export function clampPct(v: number): number {
  return Math.min(200, Math.max(0, Math.round(v)))
}

/** Same string is valid for CSS `filter` and canvas `ctx.filter`. */
export function filterString(a: Adjust): string {
  if (a.brightness === 100 && a.contrast === 100) return 'none'
  return `brightness(${a.brightness}%) contrast(${a.contrast}%)`
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/filters.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/filters.ts tests/lib/filters.test.ts
git commit -m "feat(lib): add filters module

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `lib/transform.ts` (TDD)

**Files:**
- Create: `src/lib/transform.ts`
- Test: `tests/lib/transform.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VIEW, MAX_ZOOM, MIN_ZOOM, clampPan, cssTransform, rotateBy, zoomBy,
} from '@/lib/transform'

describe('transform', () => {
  it('clamps zoom to the allowed range', () => {
    expect(zoomBy(DEFAULT_VIEW, 100).zoom).toBe(MAX_ZOOM)
    expect(zoomBy(DEFAULT_VIEW, 0.001).zoom).toBe(MIN_ZOOM)
  })
  it('resets pan when zoom returns to 1', () => {
    const v = { ...DEFAULT_VIEW, zoom: 2, panX: 40, panY: 10 }
    const out = zoomBy(v, 0.5)
    expect(out.zoom).toBe(1)
    expect(out.panX).toBe(0)
    expect(out.panY).toBe(0)
  })
  it('clamps pan to half the overflow', () => {
    const v = { ...DEFAULT_VIEW, zoom: 2, panX: 999, panY: -999 }
    expect(clampPan(v, { w: 200, h: 100 })).toMatchObject({ panX: 100, panY: -50 })
  })
  it('rotates in 90 degree steps and wraps', () => {
    expect(rotateBy(DEFAULT_VIEW, 90).rotation).toBe(90)
    expect(rotateBy({ ...DEFAULT_VIEW, rotation: 270 }, 90).rotation).toBe(0)
    expect(rotateBy(DEFAULT_VIEW, -90).rotation).toBe(270)
  })
  it('emits a css transform', () => {
    expect(cssTransform({ zoom: 2, panX: 10, panY: 5, rotation: 90 })).toBe(
      'translate(10px, 5px) rotate(90deg) scale(2)',
    )
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/transform.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/transform.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transform.ts tests/lib/transform.test.ts
git commit -m "feat(lib): add zoom/pan/rotate transform math

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `lib/image-load.ts` (TDD)

**Files:**
- Create: `src/lib/image-load.ts`
- Test: `tests/lib/image-load.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { fitWithin, validateFile } from '@/lib/image-load'

const f = (name: string, type: string) => ({ name, type }) as File

describe('validateFile', () => {
  it('accepts png/jpeg/webp/gif/avif', () => {
    for (const t of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']) {
      expect(validateFile(f('a', t))).toEqual({ ok: true })
    }
  })
  it('rejects HEIC by mime type', () => {
    const r = validateFile(f('a.heic', 'image/heic'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/HEIC/i)
  })
  it('rejects HEIC by extension when mime is empty', () => {
    expect(validateFile(f('IMG_1.HEIF', '')).ok).toBe(false)
  })
  it('rejects non-images', () => {
    const r = validateFile(f('a.pdf', 'application/pdf'))
    expect(r.ok).toBe(false)
  })
})

describe('fitWithin', () => {
  it('leaves small images alone', () => {
    expect(fitWithin(800, 600, 4096)).toEqual({ width: 800, height: 600, scaled: false })
  })
  it('scales the longest side down, keeping aspect', () => {
    expect(fitWithin(8000, 4000, 4000)).toEqual({ width: 4000, height: 2000, scaled: true })
    expect(fitWithin(3000, 6000, 3000)).toEqual({ width: 1500, height: 3000, scaled: true })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/image-load.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
export const MAX_SIDE = 4096
const OK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])

export interface LoadedImage {
  name: string
  bitmap: ImageBitmap
  url: string
  width: number
  height: number
  resizedFrom?: { width: number; height: number }
}

export type Validation = { ok: true } | { ok: false; reason: string }

export function validateFile(file: Pick<File, 'name' | 'type'>): Validation {
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  if (isHeic) {
    return { ok: false, reason: 'HEIC/HEIF is not supported. Export the photo as JPEG or PNG first.' }
  }
  if (!OK_TYPES.has(file.type)) {
    return { ok: false, reason: `Unsupported file type${file.type ? ` (${file.type})` : ''}.` }
  }
  return { ok: true }
}

export function fitWithin(w: number, h: number, max: number) {
  const longest = Math.max(w, h)
  if (longest <= max) return { width: w, height: h, scaled: false }
  const k = max / longest
  return { width: Math.round(w * k), height: Math.round(h * k), scaled: true }
}

/** Decodes a validated file. Throws on decode failure; callers show a toast. */
export async function loadImage(file: File, max = MAX_SIDE): Promise<LoadedImage> {
  const probe = await createImageBitmap(file)
  const from = { width: probe.width, height: probe.height }
  const fit = fitWithin(from.width, from.height, max)
  let bitmap = probe
  if (fit.scaled) {
    bitmap = await createImageBitmap(file, {
      resizeWidth: fit.width,
      resizeHeight: fit.height,
      resizeQuality: 'high',
    })
    probe.close()
  }
  return {
    name: file.name,
    bitmap,
    url: URL.createObjectURL(file),
    width: bitmap.width,
    height: bitmap.height,
    resizedFrom: fit.scaled ? from : undefined,
  }
}

export function disposeImage(img: LoadedImage | null): void {
  if (!img) return
  img.bitmap.close()
  URL.revokeObjectURL(img.url)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/image-load.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/image-load.ts tests/lib/image-load.test.ts
git commit -m "feat(lib): add image validation, downscale math and loader

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `lib/compare-state.ts` (TDD)

**Files:**
- Create: `src/lib/compare-state.ts`
- Test: `tests/lib/compare-state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '@/lib/compare-state'

const img = (name: string) => ({ name }) as never

describe('compare-state reducer', () => {
  it('fills before then after when two images arrive', () => {
    const s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    expect(s.before?.name).toBe('a')
    expect(s.after?.name).toBe('b')
  })
  it('one image fills the first empty slot', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a')] })
    expect(s.before?.name).toBe('a')
    s = reducer(s, { type: 'images', images: [img('b')] })
    expect(s.after?.name).toBe('b')
  })
  it('when both slots are full a single image replaces after', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    s = reducer(s, { type: 'images', images: [img('c')] })
    expect(s.before?.name).toBe('a')
    expect(s.after?.name).toBe('c')
  })
  it('swaps', () => {
    let s = reducer(initialState, { type: 'images', images: [img('a'), img('b')] })
    s = reducer(s, { type: 'swap' })
    expect(s.before?.name).toBe('b')
    expect(s.after?.name).toBe('a')
  })
  it('clamps slider and opacity to 0..100', () => {
    let s = reducer(initialState, { type: 'set', key: 'sliderPct', value: 150 })
    expect(s.sliderPct).toBe(100)
    s = reducer(s, { type: 'set', key: 'fadeOpacity', value: -3 })
    expect(s.fadeOpacity).toBe(0)
  })
  it('zoom action keeps view valid; reset restores defaults', () => {
    let s = reducer(initialState, { type: 'zoom', factor: 100 })
    expect(s.view.zoom).toBe(8)
    s = reducer(s, { type: 'resetView' })
    expect(s.view.zoom).toBe(1)
  })
  it('sets adjust with clamping', () => {
    const s = reducer(initialState, { type: 'adjust', key: 'brightness', value: 999 })
    expect(s.adjust.brightness).toBe(200)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/compare-state.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
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
  format: Format
  quality: number
}

export const initialState: CompareState = {
  before: null,
  after: null,
  mode: 'slider',
  sliderPct: 50,
  fadeOpacity: 50,
  onionOpacity: 50,
  view: DEFAULT_VIEW,
  adjust: NEUTRAL_ADJUST,
  format: 'png',
  quality: 92,
}

type PctKey = 'sliderPct' | 'fadeOpacity' | 'onionOpacity'

export type Action =
  | { type: 'images'; images: LoadedImage[] }
  | { type: 'swap' }
  | { type: 'mode'; mode: Mode }
  | { type: 'set'; key: PctKey; value: number }
  | { type: 'adjust'; key: keyof Adjust; value: number }
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
      if (first && second) return { ...s, before: first, after: second }
      if (first && !s.before) return { ...s, before: first }
      if (first) return { ...s, after: first }
      return s
    }
    case 'swap':
      return { ...s, before: s.after, after: s.before }
    case 'mode':
      return { ...s, mode: a.mode }
    case 'set':
      return { ...s, [a.key]: pct(a.value) }
    case 'adjust':
      return { ...s, adjust: { ...s.adjust, [a.key]: clampPct(a.value) } }
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/compare-state.test.ts`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/compare-state.ts tests/lib/compare-state.test.ts
git commit -m "feat(lib): add compare state reducer

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `lib/render.ts` layout plan (TDD)

The plan is pure data (testable in Node); `drawPlan` applies it to a canvas context.

**Files:**
- Create: `src/lib/render.ts`
- Test: `tests/lib/render.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { initialState, type CompareState } from '@/lib/compare-state'
import { planExport } from '@/lib/render'

const img = (w: number, h: number) => ({ width: w, height: h }) as never
const base = (over: Partial<CompareState> = {}): CompareState => ({
  ...initialState,
  before: img(800, 600),
  after: img(800, 600),
  ...over,
})

describe('planExport', () => {
  it('returns null without both images', () => {
    expect(planExport({ ...initialState }, 'snapshot')).toBeNull()
  })
  it('combined is two images side by side at the before size', () => {
    const p = planExport(base(), 'combined')!
    expect(p.width).toBe(1600)
    expect(p.height).toBe(600)
    expect(p.layers).toHaveLength(2)
    expect(p.layers[1]).toMatchObject({ which: 'after', dx: 800, dw: 800 })
  })
  it('snapshot in slider mode clips the after image at sliderPct', () => {
    const p = planExport(base({ mode: 'slider', sliderPct: 25 }), 'snapshot')!
    expect(p.width).toBe(800)
    expect(p.layers[1].clip).toEqual({ x: 200, y: 0, w: 600, h: 600 })
  })
  it('snapshot in fade mode uses fadeOpacity as after alpha', () => {
    const p = planExport(base({ mode: 'fade', fadeOpacity: 30 }), 'snapshot')!
    expect(p.layers[1].alpha).toBeCloseTo(0.3)
  })
  it('snapshot in onion mode uses onionOpacity and multiply-free blending', () => {
    const p = planExport(base({ mode: 'onion', onionOpacity: 60 }), 'snapshot')!
    expect(p.layers[1].alpha).toBeCloseTo(0.6)
  })
  it('snapshot in side mode equals the combined layout', () => {
    const a = planExport(base({ mode: 'side' }), 'snapshot')!
    const b = planExport(base(), 'combined')!
    expect(a.layers.map((l) => l.dx)).toEqual(b.layers.map((l) => l.dx))
  })
  it('fits the after image into the before-sized cell, keeping aspect', () => {
    const p = planExport(base({ after: img(400, 600) }), 'combined')!
    expect(p.layers[1]).toMatchObject({ dw: 400, dh: 600, dx: 800 + 200 })
  })
  it('swaps output dimensions for 90 degree rotation', () => {
    const p = planExport(base({ mode: 'fade', view: { zoom: 1, panX: 0, panY: 0, rotation: 90 } }), 'snapshot')!
    expect(p.width).toBe(600)
    expect(p.height).toBe(800)
  })
  it('carries the same filter for both export kinds (regression: old dlCombined/dlSnapshot)', () => {
    const s = base({ adjust: { brightness: 120, contrast: 90 } })
    expect(planExport(s, 'combined')!.filter).toBe(planExport(s, 'snapshot')!.filter)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/render.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
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

export function planExport(s: CompareState, kind: ExportKind): ExportPlan | null {
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
  return {
    width: quarter ? contentH : contentW,
    height: quarter ? contentW : contentH,
    layers,
    filter: filterString(s.adjust),
    rotation: s.view.rotation,
    zoom: kind === 'snapshot' ? s.view.zoom : 1,
    panX: kind === 'snapshot' ? s.view.panX : 0,
    panY: kind === 'snapshot' ? s.view.panY : 0,
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

export function renderToCanvas(s: CompareState, kind: ExportKind): HTMLCanvasElement | null {
  const plan = planExport(s, kind)
  if (!plan || !s.before || !s.after) return null
  const canvas = document.createElement('canvas')
  canvas.width = plan.width
  canvas.height = plan.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  drawPlan(ctx, plan, { before: s.before.bitmap, after: s.after.bitmap })
  return canvas
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/lib/render.test.ts`
Expected: 9 passed. If the "onion" test name misleads, it only asserts alpha; the visual difference between fade and onion in the live viewer (mix-blend) is a CSS concern, not exported.

- [ ] **Step 5: Commit**

```bash
git add src/lib/render.ts tests/lib/render.test.ts
git commit -m "feat(lib): add single render pipeline for all exports

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `lib/export.ts` (TDD)

**Files:**
- Create: `src/lib/export.ts`
- Test: `tests/lib/export.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildFilename, extFor, mimeFor, qualityFor } from '@/lib/export'

describe('export helpers', () => {
  it('maps format to mime and extension', () => {
    expect(mimeFor('png')).toBe('image/png')
    expect(mimeFor('jpeg')).toBe('image/jpeg')
    expect(mimeFor('webp')).toBe('image/webp')
    expect(extFor('jpeg')).toBe('jpg')
  })
  it('quality is undefined for png, 0..1 for lossy formats', () => {
    expect(qualityFor('png', 90)).toBeUndefined()
    expect(qualityFor('jpeg', 90)).toBe(0.9)
    expect(qualityFor('webp', 100)).toBe(1)
  })
  it('builds a dated filename', () => {
    expect(buildFilename('combined', 'jpeg', new Date('2026-09-29T10:00:00Z'))).toBe(
      'before-after-combined-2026-09-29.jpg',
    )
    expect(buildFilename('snapshot', 'png', new Date('2026-01-02T10:00:00Z'))).toBe(
      'before-after-snapshot-2026-01-02.png',
    )
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/lib/export.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
import type { Format } from '@/lib/compare-state'
import type { ExportKind } from '@/lib/render'

const MIME: Record<Format, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

export const mimeFor = (f: Format) => MIME[f]
export const extFor = (f: Format) => (f === 'jpeg' ? 'jpg' : f)
export const qualityFor = (f: Format, pct: number) => (f === 'png' ? undefined : pct / 100)

export function buildFilename(kind: ExportKind, f: Format, now = new Date()): string {
  return `before-after-${kind}-${now.toISOString().slice(0, 10)}.${extFor(f)}`
}

export function canvasToBlob(canvas: HTMLCanvasElement, f: Format, qualityPct: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image. Try a smaller image or another format.'))),
      mimeFor(f),
      qualityFor(f, qualityPct),
    )
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: all lib suites pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts tests/lib/export.test.ts
git commit -m "feat(lib): add export helpers (blob encode, filename, download)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Install the 21st.dev components

**Files:** generated under `src/components/ui/` and helper dirs.

- [ ] **Step 1: Get an API key**

`$API_KEY_21ST` must be set in the shell (key from https://21st.dev/mcp). If it is not set, ask the user for it once, or use the fallback in the global rules (fetch source with `get_component`, write files, install dependencies).

- [ ] **Step 2: Install all six**

```bash
npx shadcn@latest add "https://21st.dev/r/daiwiikharihar/panoramic-spread-hero?api_key=$API_KEY_21ST"
npx shadcn@latest add "https://21st.dev/r/ruixen.ui/ruixen-gradient-footer?api_key=$API_KEY_21ST"
npx shadcn@latest add "https://21st.dev/r/rmahammad/compare-reveal?api_key=$API_KEY_21ST"
npx shadcn@latest add "https://21st.dev/r/extend-hq/file-upload-2?api_key=$API_KEY_21ST"
npx shadcn@latest add "https://21st.dev/r/aicanvas/expanding-tabs?api_key=$API_KEY_21ST"
npx shadcn@latest add "https://21st.dev/r/johuniq/animated-theme-toggle?api_key=$API_KEY_21ST"
```

- [ ] **Step 3: Ensure dependencies**

```bash
npm install motion framer-motion clsx tailwind-merge border-beam @hugeicons/react @hugeicons/core-free-icons @phosphor-icons/react next-themes
```

- [ ] **Step 4: Verify compile**

```bash
npm run build
```

Expected: success. If a component imports a missing helper, add it with the matching shadcn command (`card`, `file-thumbnail`) and re-run.

- [ ] **Step 5: Record actual file names**

Run `git status --short src/components` and note the exact generated file names and exported component names. Tasks 11 to 16 import them; adjust import paths to what was generated.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): install 21st.dev components (hero, footer, compare, upload, tabs, theme)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Source the remaining slots from 21st.dev

Slots without a component yet: edit toolbar, download bar, legal modals, toast (spec section 2).

- [ ] **Step 1: Search**

Use MCP `search` on server `f89af618-7ede-49e7-add4-58da261e6961` for each slot, in the visual language of the hero/footer (dark neutral, mono, editorial). Queries: "toolbar with slider controls", "zoom controls", "download button group", "modal dialog", "toast notification".

- [ ] **Step 2: Present candidates**

Show the user 2-3 candidates per slot with their 21st.dev links and wait for a pick. Do not choose visually on the user's behalf beyond shortlisting; the user's binding rule is that components are chosen from 21st.dev, and previous rounds were user-approved.

- [ ] **Step 3: Install the picks**

Same `npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"` pattern. Where the user prefers a plain shadcn primitive (already installed in Task 3: button, slider, dialog, select, sonner, tooltip), skip the install.

- [ ] **Step 4: Verify and commit**

```bash
npm run build
git add -A
git commit -m "feat(ui): add toolbar, download bar, modal and toast components

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Hooks

**Files:**
- Create: `src/hooks/useCompareState.ts`, `src/hooks/usePasteImages.ts`

- [ ] **Step 1: `useCompareState`**

```ts
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
```

- [ ] **Step 2: `usePasteImages`**

```ts
import { useEffect } from 'react'

export function usePasteImages(onFiles: (files: File[]) => void) {
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        onFiles(files)
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [onFiles])
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
npm run typecheck
git add src/hooks
git commit -m "feat(hooks): add compare state and paste hooks

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Hero with real sample pairs

**Files:**
- Create: `src/lib/samples.ts`, `src/components/Hero.tsx`

- [ ] **Step 1: `samples.ts`**

```ts
export interface SamplePair {
  slug: string
  title: string
  beforeLabel: string
  afterLabel: string
}

export const SAMPLE_PAIRS: SamplePair[] = [
  { slug: 'neworleans', title: 'New Orleans after Katrina', beforeLabel: 'Aug 27, 2005', afterLabel: 'Aug 30, 2005' },
  { slug: 'vegas', title: 'Las Vegas growth', beforeLabel: '1984', afterLabel: '2009' },
  { slug: 'hobet', title: 'Hobet mine', beforeLabel: '2000', afterLabel: '2010' },
  { slug: 'aral', title: 'Aral Sea', beforeLabel: '2000', afterLabel: '2009' },
  { slug: 'dubai', title: 'Dubai', beforeLabel: '2000', afterLabel: '2011' },
  { slug: 'columbia', title: 'Columbia Glacier', beforeLabel: '1986', afterLabel: '2024' },
  { slug: 'powell', title: 'Lake Powell', beforeLabel: '1999', afterLabel: '2021' },
  { slug: 'amazon', title: 'Amazon deforestation', beforeLabel: '2000', afterLabel: '2012' },
]

export const sampleUrl = (slug: string, which: 'before' | 'after') => `/samples/${slug}-${which}.webp`
```

- [ ] **Step 2: Wire the installed hero**

Open the installed hero file. Replace its hard-coded `IMAGES` array and copy ("Exhibition / Curated Space.") as follows, keeping its layout and animation code untouched:
- Each of the 8 cards renders a `CompareReveal` (installed in Task 10) with `before={{ src: sampleUrl(slug,'before'), alt: ... }}`, `after={{ src: sampleUrl(slug,'after'), alt: ... }}`, `introSweep`, and the pair `title` as the card caption. If the hero card cannot host a nested interactive component, use the `after` image with a small "before" corner thumbnail and the caption.
- Headline: "See the difference." Sub line: "Compare two images in seconds. Free, private, in your browser."
- Add a "Try it now" button that calls `document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })`.
- Export a `Hero` component from `src/components/Hero.tsx` that renders the hero.

- [ ] **Step 3: Browser check**

Start the dev server (`preview_start` name `dev`), scroll through the hero. Verify: 8 cards show real NASA images, no console errors, "Try it now" scrolls to `#tool`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: hero with real before/after sample pairs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Viewer (four modes) and upload

**Files:**
- Create: `src/components/Viewer.tsx`, `src/components/Tool.tsx`

- [ ] **Step 1: `Viewer.tsx`**

```tsx
import type { CSSProperties } from 'react'
import type { CompareState, Action } from '@/lib/compare-state'
import { filterString } from '@/lib/filters'
import { cssTransform } from '@/lib/transform'
import { CompareReveal } from '@/components/ui/compare-reveal' // adjust to installed path

export function Viewer({ state, dispatch }: { state: CompareState; dispatch: React.Dispatch<Action> }) {
  const { before, after, mode, view, adjust } = state
  if (!before || !after) return null

  const wrapper: CSSProperties = {
    transform: cssTransform(view),
    filter: filterString(adjust),
    transformOrigin: 'center',
  }
  const beforeImg = { src: before.url, alt: 'Before' }
  const afterImg = { src: after.url, alt: 'After' }

  return (
    <div className="relative overflow-hidden rounded-xl border" data-testid="viewer">
      <div style={wrapper} className="will-change-transform">
        {mode === 'slider' && (
          <CompareReveal
            before={beforeImg}
            after={afterImg}
            position={state.sliderPct}
            onPositionChange={(v: number) => dispatch({ type: 'set', key: 'sliderPct', value: v })}
            snapOnDoubleClick
          />
        )}
        {mode === 'side' && (
          <div className="grid grid-cols-2 gap-1">
            <img src={before.url} alt="Before" className="w-full object-contain" />
            <img src={after.url} alt="After" className="w-full object-contain" />
          </div>
        )}
        {(mode === 'fade' || mode === 'onion') && (
          <div className="relative">
            <img src={before.url} alt="Before" className="w-full object-contain" />
            <img
              src={after.url}
              alt="After"
              className="absolute inset-0 h-full w-full object-contain"
              style={{
                opacity: (mode === 'fade' ? state.fadeOpacity : state.onionOpacity) / 100,
                mixBlendMode: mode === 'onion' ? 'difference' : 'normal',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

Pan handling: attach `onPointerDown/Move/Up` to the outer div. Start a pan only when `state.view.zoom > 1` and (Space is held, or `e.button === 1`), and dispatch `{ type: 'pan', dx, dy }` with the pointer delta. Ignore the pointer when it starts on the compare handle. Two-finger touch pan: use `onTouchMove` with two touches, dispatch the centroid delta.

Note on the old behavior: check `legacy/index.html` for the exact onion blend used (search `onion`) and mirror it if it is not `difference`; the export in `render.ts` uses plain alpha, so keep the two visually close, or switch the viewer to plain alpha if the old site did.

- [ ] **Step 2: `Tool.tsx`**

Compose in this order, using installed components only:
1. File Upload (installed in Task 10) with `onFiles={addFiles}` shown when either image is missing, and a compact "Replace / Swap" row when both are set (`dispatch({ type: 'swap' })`).
2. Expanding Tabs with items Slider, Side, Fade, Onion mapped to `dispatch({ type: 'mode', mode })`.
3. `<Viewer state={state} dispatch={dispatch} />`.
4. `<Toolbar>` and `<ExportBar>` (Tasks 15).
5. Root element `id="tool"`, and call `usePasteImages(addFiles)`.

- [ ] **Step 3: Browser check with fixtures**

Serve `tests/fixtures/before.png` and `after.png` via the file input (Claude in Chrome `file_upload`, or the dev server's file input). Switch all four modes, confirm each renders and the slider handle moves.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: viewer with four modes and upload wiring

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Toolbar and export bar

**Files:**
- Create: `src/components/Toolbar.tsx`, `src/components/ExportBar.tsx`

- [ ] **Step 1: `Toolbar.tsx`**

Uses the toolbar component picked in Task 11 (or shadcn `Button` + `Slider`). Controls and their dispatches:
- Zoom in / out: `{ type: 'zoom', factor: 1.25 }` / `{ type: 'zoom', factor: 0.8 }`
- Reset view: `{ type: 'resetView' }`
- Rotate left / right: `{ type: 'rotate', deg: -90 }` / `{ type: 'rotate', deg: 90 }`
- Brightness and contrast sliders (0 to 200): `{ type: 'adjust', key, value }`
- Opacity slider shown only in `fade` and `onion` modes: `{ type: 'set', key: mode === 'fade' ? 'fadeOpacity' : 'onionOpacity', value }`

- [ ] **Step 2: `ExportBar.tsx`**

```tsx
import { toast } from 'sonner'
import type { Action, CompareState, Format } from '@/lib/compare-state'
import { buildFilename, canvasToBlob, downloadBlob } from '@/lib/export'
import { renderToCanvas, type ExportKind } from '@/lib/render'

export function ExportBar({ state, dispatch }: { state: CompareState; dispatch: React.Dispatch<Action> }) {
  const run = async (kind: ExportKind) => {
    const canvas = renderToCanvas(state, kind)
    if (!canvas) return toast.error('Add both images first.')
    try {
      const blob = await canvasToBlob(canvas, state.format, state.quality)
      downloadBlob(blob, buildFilename(kind, state.format))
    } catch (e) {
      toast.error('Export failed', { description: e instanceof Error ? e.message : 'Try again with a smaller image.' })
    }
  }
  // Render: format Select (png | jpeg | webp -> dispatch format), quality Slider (1..100, disabled for png),
  // and two buttons: "Download combined" -> run('combined'), "Download current view" -> run('snapshot').
  return null
}
```

Replace the trailing `return null` with the JSX built from the download-bar component chosen in Task 11 (or shadcn `Select`, `Slider`, `Button`), wired exactly as the comment states. `format` values are `'png' | 'jpeg' | 'webp'`.

- [ ] **Step 3: Browser check (regression for the old export bug)**

With fixtures loaded, export "combined" and "current view" as JPEG at quality 50 and as WebP. Verify both files have the chosen extension and that file sizes change with quality. (Unit test in Task 8 covers layout parity; this covers the download path.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: toolbar and export bar using one render pipeline

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Footer, legal dialogs, theme, App

**Files:**
- Create: `src/components/SiteFooter.tsx`, `src/components/LegalDialogs.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Legal dialogs**

`LegalDialogs.tsx` exports `LegalDialogs({ open, onOpenChange })` with three dialogs (About, Terms, Privacy) built from the modal component chosen in Task 11 (or shadcn `Dialog`). Copy, in English:
- About: "Before & After Pro compares two images in your browser. Nothing is uploaded."
- Terms: "This tool is provided as is, free of charge. You are responsible for the images you use."
- Privacy: "Images are processed locally in your browser and are never sent to a server. This site sets no tracking cookies. Your theme choice is stored in your browser's local storage."

- [ ] **Step 2: Footer**

`SiteFooter.tsx` wraps the installed `RuixenGradientFooter gradientHeight="40vh"`, with children: brand line "Before & After Pro", three buttons (About, Terms, Privacy) opening the dialogs, and a copyright line. Keep spacing above the footer so the fixed rainbow band does not cover the export bar.

- [ ] **Step 3: Theme**

In `src/main.tsx` wrap `<App/>` in `ThemeProvider` from `next-themes` with `attribute="class" defaultTheme="system" enableSystem`. Place the installed Animated Theme Toggle in a fixed top-right container inside `App`. Add `<Toaster />` (sonner) once.

- [ ] **Step 4: `App.tsx`**

```tsx
import { Hero } from '@/components/Hero'
import { SiteFooter } from '@/components/SiteFooter'
import { Tool } from '@/components/Tool'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <>
      <Hero />
      <Tool />
      <SiteFooter />
      <Toaster />
    </>
  )
}
```

Keep the app shell free of `transform` and `filter` on any ancestor of the footer (spec section 10).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: footer, legal dialogs, theme and app shell

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Full browser verification

- [ ] **Step 1: Start**

`preview_start` with name `dev`. Use the built-in browser for the dev server; per the user's global rule, use Claude in Chrome for any external-site interaction.

- [ ] **Step 2: Checklist (all must pass; record results)**

1. Console has no errors on load, on scroll through hero, and after each interaction below.
2. Upload two fixtures: before gets the first, after the second. Swap exchanges them.
3. Drop two files at once and paste an image with Ctrl+V.
4. Upload a `.heic` file and a `.pdf`: a toast explains, state is unchanged.
5. All four modes render. Slider handle drags with mouse, arrow keys, and touch.
6. Zoom in (pan works with Space+drag and middle button), zoom out returns pan to 0, rotate 4 times returns to 0.
7. Brightness and contrast visibly change the viewer and the export.
8. Export combined and current view as PNG, JPEG, WebP; files download with the correct extension.
9. Theme toggle switches light/dark and persists on reload; first visit follows the system theme.
10. Footer dialogs open and close; rainbow band is visible and not clipped.
11. Resize to 375 px wide: no horizontal scroll, controls reachable.
12. Both themes screenshot for the user.

- [ ] **Step 3: Type-check, tests, build**

```bash
npm run typecheck && npm test && npm run build
```

Expected: all pass. Note the bundle size printed by `vite build`; if the main chunk is over 500 kB gzip-unfriendly, lazy-load the upload component (`React.lazy`).

- [ ] **Step 4: Fix anything found, re-verify, commit**

```bash
git add -A
git commit -m "fix: issues found during browser verification

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Remove the legacy site and finish

- [ ] **Step 1: Parity check**

Compare `legacy/index.html` features against the new app once more: four modes, zoom/pan/rotate, brightness/contrast, three export formats, paste, theme, legal pages. Report any gap to the user before deleting.

- [ ] **Step 2: Delete legacy and commit**

```bash
git rm -r legacy
git commit -m "chore: remove legacy single-file site after parity check

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Hand off**

Do not deploy. Report the results to the user and ask explicitly before any Vercel deploy (spec section 9).

---

## Self-Review

**Spec coverage**
- Component manifest (spec 2): Task 10 (six installs), Task 11 (remaining slots).
- Architecture and lib modules (spec 3): Tasks 4 to 9 (filters, transform, compare-state, image-load, render, export), Task 12 (hooks).
- Viewer modes and shared transform (spec 3): Task 14.
- Data flow (spec 4): Tasks 6, 7, 12, 15.
- Bug fixes (spec 5): single render pipeline (Tasks 8, 9, 15), bitmaps and object URLs with disposal (Tasks 6, 12), multi-drop and paste (Tasks 7, 12, 14), HEIC error toast (Tasks 6, 12), theme follows system (Task 16), cookie banner removed (Task 16 copy, not reinstated), launch.json (Task 2), stray PNGs moved (Task 1).
- Hero imagery (spec 6): Task 13 with the 16 NASA files.
- Error handling (spec 7): Tasks 6, 12, 15.
- Testing (spec 8): Tasks 4 to 9 unit tests, including the combined/snapshot filter parity regression; Task 17 browser checklist, typecheck and build.
- Deployment (spec 9): Task 18 defers deploy to explicit approval; `.gitignore` in Task 1.
- Risks (spec 10): fixed-position footer (Task 16), bundle size check (Task 17).

**Placeholder scan:** Task 11 and the JSX bodies of Tasks 14, 15 and 16 depend on which 21st.dev components the user picks and what file names the shadcn installs generate; each states exactly what to wire, which state and actions to use, and what to verify. No unresolved TBDs otherwise.

**Type consistency:** `Format`, `Mode`, `CompareState`, `Action` are defined in Task 7 and used unchanged in Tasks 9, 12, 14, 15. `ExportKind` and `renderToCanvas` are defined in Task 8 and used in Task 15. `LoadedImage`, `loadImage`, `disposeImage`, `validateFile`, `fitWithin` are defined in Task 6 and used in Task 12. `View`, `zoomBy`, `rotateBy`, `cssTransform` are defined in Task 5 and used in Tasks 7 and 14.
