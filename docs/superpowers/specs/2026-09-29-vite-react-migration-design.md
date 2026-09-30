# Before & After Pro: Vite + React Migration (Phase 1)

Date: 2026-09-29
Status: Draft, awaiting user review

## 1. Goal

Move the single-file static site (`index.html`, ~2300 lines of vanilla JS) to a
Vite + React + TypeScript + Tailwind + shadcn/ui app, and rebuild its UI from
21st.dev components. Fix the known export and UX bugs on the way.

The site is client-side only (no backend) and deploys to Vercel. It already gets
organic traffic (15 clicks / 28 days in Search Console) with no promotion, so
Phase 1 must not regress the working tool.

### Design rule (binding, from the user)

The UI is **not hand-designed**. Every visual component is pulled from 21st.dev
with `get_component` (never `generate`) and installed with the shadcn
registry command. Custom code is limited to state, logic, wiring, copy and
layout composition.

### Out of scope for Phase 1

SEO landing pages, analytics, GIF/MP4 export, difference/heatmap mode, embed
code, 3+ image comparison, PWA, monetization (Phases 2 to 4).

## 2. Component manifest

| Slot | Component | Registry id | Install path | Notes |
|---|---|---|---|---|
| Hero | Panoramic Spread Hero (daiwiikharihar) | 30669 | `daiwiikharihar/panoramic-spread-hero` | 400vh scroll-driven sticky scene. Uses `motion/react`. Copy and the 8 images are replaced |
| Footer | Ruixen Gradient Footer (ruixen.ui) | 21203 | `ruixen.ui/ruixen-gradient-footer` | Rainbow band is `position: fixed`, so no ancestor may use `transform`/`filter` |
| Comparison (slider mode) | Compare Reveal (rmahammad) | 23419 | `rmahammad/compare-reveal` | `before`/`after` accept nodes; `position`/`onPositionChange` are controlled; clip-path based; keyboard + ARIA built in; injects its own `--motiq-*` tokens |
| Upload | File Upload (extend-hq) | 21308 | `extend-hq/file-upload-2` | Needs `border-beam`, `@hugeicons/react`, `@hugeicons/core-free-icons`, `card`, `file-thumbnail`. Installed via the shadcn command so the helper files come with it |
| Mode switch | Expanding Tabs (aicanvas) | 30168 | `aicanvas/expanding-tabs` | Needs `framer-motion`, `@phosphor-icons/react`. Tab list becomes Slider / Side / Fade / Onion |
| Theme | Animated Theme Toggle (johuniq) | 10448 | `johuniq/animated-theme-toggle` | Needs `next-themes` (works with Vite through `ThemeProvider`) |

Install command shape: `npx shadcn@latest add "https://21st.dev/r/<author>/<slug>?api_key=$API_KEY_21ST"`.

### Slots still to be sourced

These have no component yet. During planning each one is searched on 21st.dev
(`search`, then `get_component`) and reviewed with the user for visual fit
with the hero and footer (dark neutral, mono type, editorial):

- Edit toolbar: zoom in/out/reset, rotate, brightness, contrast, fade/onion opacity.
- Download bar: format, quality, "combined" and "snapshot" export.
- Modals: Terms, Privacy, About.
- Toast/notice for errors (HEIC, unsupported file).

Plain shadcn primitives (Button, Slider, Dialog, Select, Sonner) are acceptable
as base building blocks where no 21st.dev component fits, because they are the
same registry the 21st components already build on.

## 3. Architecture

```
/                      Vite project root
  index.html           Vite entry (SEO meta placeholders now, filled in Phase 2)
  legacy/index.html    old site, kept until parity is confirmed, then deleted
  src/
    main.tsx           React root + ThemeProvider
    App.tsx            page order: Hero, Tool, Footer
    components/ui/     21st.dev / shadcn components (generated, not hand-edited
                       except copy and prop wiring)
    components/        thin composition wrappers only
      Tool.tsx         layout of upload, mode tabs, viewer, toolbar, export bar
      Viewer.tsx       picks the view for the active mode
    lib/               pure logic, no React, unit tested
      compare-state.ts state shape, reducer, defaults
      transform.ts     zoom / pan / rotate math and clamping
      filters.ts       brightness / contrast to CSS filter string and canvas filter
      render.ts        single canvas render pipeline used by every export
      image-load.ts    File to ImageBitmap, downscale, HEIC detection
      export.ts        canvas to Blob, filename, download trigger
    hooks/
      useCompareState.ts
      usePasteImages.ts
  public/              samples/ (hero + demo before/after pairs), favicon
```

`lib/` is the only place with real logic. Each module has one job, a small
typed interface, and no dependency on React or the DOM other than
`render.ts`/`image-load.ts` (canvas, `createImageBitmap`).

### Page structure and first screen

1. **Hero** (Panoramic Spread): scroll-driven, 400vh. Includes a clear
   "Try it now" button that scrolls to the tool. The tool is below the hero, not
   above the fold; this is an accepted consequence of the chosen hero.
2. **Tool**: upload, mode tabs, viewer, toolbar, export bar.
3. **Footer** (Ruixen): About / Terms / Privacy open modals; brand line and
   copyright replace the demo content. Gradient band height tuned so it does
   not cover the export bar.

### Viewer modes

| Mode | Implementation |
|---|---|
| Slider | Compare Reveal, `position` controlled from state |
| Side | Two images in a grid, shared zoom/pan transform |
| Fade | Stacked images, top one opacity from state |
| Onion | Stacked images, top one at opacity with `mix-blend-mode` from state |

Zoom, pan and rotate are applied by one wrapper element around the active
view (`transform: scale() translate() rotate()`), same as the old site.
Brightness/contrast are a CSS `filter` on the same wrapper. In slider mode the
handle keeps drag priority; panning uses Space+drag, middle-button drag, or
two-finger gesture, and only while zoom > 1.

## 4. Data flow

`useCompareState` holds one state object (same fields as the old `S`, minus
data URLs): `before`/`after` (ImageBitmap + metadata + object URL), `mode`,
`sliderPct`, `fadeOpacity`, `onionOpacity`, `zoom`, `panX`, `panY`, `rotation`,
`brightness`, `contrast`, `format`, `quality`.

1. Upload / paste / drop gives `File[]`. `image-load.ts` validates type, decodes
   with `createImageBitmap`, downscales anything above a max side (default 4096
   px), and returns a bitmap plus an object URL for display.
2. Two files dropped at once fill before then after. One file fills the empty
   slot. Swap exchanges them.
3. Toolbar controls dispatch to the reducer. `Viewer` renders from state.
4. Export calls `render.ts` with the same state and produces a canvas; `export.ts`
   uses `canvas.toBlob(type, quality)` (not `toDataURL`) and downloads via an
   object URL that is revoked afterwards.

## 5. Bug fixes included

- One render pipeline for "combined" and "snapshot" exports, so quality, format
  (PNG/JPEG/WebP) and aspect ratio are honored identically. Fixes the old
  `dlCombined`/`dlSnapshot` divergence.
- Object URLs and `ImageBitmap`s instead of `FileReader` data URLs (memory).
  Revoke/close on replace and unmount.
- Multi-file drop and clipboard paste.
- Clear error for HEIC/HEIF (unsupported by the canvas path in most browsers) and
  other non-image files, shown as a toast.
- Slider accessibility (Compare Reveal already provides pointer, keyboard, ARIA).
- Theme follows `prefers-color-scheme` on first visit, then the stored choice.
- Cookie banner removed: Phase 1 sets no tracking cookies. Theme choice stays in
  `localStorage` (functional only). The banner returns only if Phase 2 analytics
  needs consent.
- Stale `.claude/launch.json` points at the new dev server.
- Stray `test_before.png` / `test_after.png` removed from the repo root; copies
  move to `tests/fixtures/` if a test needs them.

## 6. Hero and demo imagery

The hero's 8 cards must be real before/after examples, not the 21st.dev demo
photos. Requirements:

- Each card shows one comparison (or a before/after pair split diagonally).
- Source images are user-supplied or license-cleared. Placeholder pairs from
  the repo's `test_*.png` are acceptable for development only.
- Images are served from `public/samples/`, compressed (WebP, max 1600 px).

**Open item for the user:** provide or approve the sample image pairs before
launch.

## 7. Error handling

- Decode failure or unsupported type: toast with the file name and reason; state
  unchanged.
- Oversized image: downscale silently, show a small "resized to N px" note.
- Canvas export failure (`toBlob` returns null, memory): toast with a retry hint.
- All failures are recoverable; no thrown errors reach the React error boundary
  except programmer errors.

## 8. Testing

- **Vitest unit tests (written first)** for `compare-state`, `transform`,
  `filters`, `render` (against a canvas mock or `node-canvas`), `image-load`
  (type validation, downscale math) and `export` (filename, mime, quality).
- **Regression tests for the old bugs**: same state exported "combined" and
  "snapshot" yields the same mime type, dimensions and quality setting.
- **Browser verification** with the dev server: upload two fixtures, switch all
  four modes, zoom/pan/rotate, adjust brightness/contrast, export each format,
  toggle theme, open modals, scroll through hero and footer, check console for
  errors. Mobile viewport check (375 px) and dark/light check.
- Type-check (`tsc --noEmit`) and production build (`vite build`) must pass.

## 9. Deployment

Vercel detects Vite. Build command `vite build`, output `dist`. `.gitignore`
adds `dist`, `node_modules`. `vercel.json` only if a rewrite is needed for
later static pages. Deploy is not part of Phase 1 implementation and needs
explicit approval when the time comes.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Hero is 400vh and delays access to the tool | "Try it now" scroll button; measure bounce in Phase 2 analytics; the hero can be shortened via its scroll-height wrapper |
| Footer gradient uses `position: fixed` and breaks under transformed ancestors | Keep the app shell free of `transform`/`filter`; test in browser |
| Components pulled from 21st.dev change or disappear | Code is copied into the repo; no runtime dependency on 21st.dev |
| Compare Reveal's own token CSS clashes with the shadcn theme | Tokens are namespaced `--motiq-*` in a low cascade layer; verify in both themes |
| `border-beam` / hugeicons add bundle weight | Check bundle size after install; lazy-load the upload component if needed |
| Bitmap memory on large or many images | Downscale cap, close bitmaps on replace |
