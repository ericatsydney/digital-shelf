# First-Session Polish (progress, controls hint, capture, mobile guard) — Design

**Date:** 2026-10-31
**Status:** Draft for user review (no code written)
**Source:** `docs/2026-10-31-ceo-product-review.md`; follows `2026-10-31-default-model-first-load-design.md` (uncommitted, same short-term goal).

## Findings that shape scope
- Mobile check at 375x812 (built-in browser): `scrollWidth == innerWidth`, no overflowing element; the stage icons, title and upward unit dropdown already fit. The CEO doc's horizontal-scrollbar finding is already fixed (commit e800d59). Scope reduces to a **regression guard**, not a redesign.
- Model loading shows only a static "Loading unit…" (10 MB GLBs; slow on mobile).
- No control hint exists. Capture downloads a bare canvas PNG with no confirmation and no model name.

## Reuse check
drei's `useProgress` only counts loader items, so a single 10 MB GLB jumps 0 to 100 and shows nothing in between. Real byte progress comes from hooking the GLTF loader's `onProgress` through `useGLTF`'s `extendLoader` argument into a tiny store (`src/scene/modelProgress.ts`); no new dependency. Capture composition uses the standard 2D canvas API.

## Requirements
1. **Loading progress:** while a unit loads, the status reads `Loading unit… NN%` from the loader's download progress events (rounded, clamped 0-100, falls back to plain "Loading unit…" when progress is 0/unknown). Disappears when loaded. Existing "Loading unit…" text match stays valid.
2. **Controls hint:** small unobtrusive hint shown after the model is ready: zoom is enabled on every stage and panning only off the Hangar, so Hangar (turntable) reads "Drag to rotate · Scroll or pinch to zoom" and Forest/Ruined City (orbit) add " · Right-drag to pan". Dismissible (× button, `aria-label="Dismiss controls hint"`) and auto-dismissed on the first pointer interaction with the canvas element itself (not other overlays). The full-width title block no longer captures pointer events so it cannot cover the hint. In-memory per visit only (consistent with the clean-default decision; no persistence). Does not overlap the stage icons or unit dropdown on mobile.
3. **Capture polish:** the saved PNG is the 3D canvas with a caption strip along the bottom (model title left, "Digital Shelf" right) drawn on an offscreen 2D canvas; filename becomes `digital-shelf-<unit-id>-<timestamp>.png`. After a successful save, show a status `Saved <filename>` (role="status") for 3 s. Failure behaviour unchanged ("Capture failed. Try again.").
4. **Mobile guard:** a Playwright test at 390x844 asserts no horizontal overflow (`documentElement.scrollWidth <= innerWidth`) and that the stage buttons, unit dropdown and capture button are inside the viewport.

## Exclusions
Persisting hint dismissal or last model, optional collection branding beyond the fixed "Digital Shelf" label, share/export formats, analytics, new layouts, accessibility audit (separate tasks).

## Interfaces
- `modelProgress.ts`: `trackModelProgress(loader)` (wraps once), `useModelProgress()`, `resetModelProgress()`; `HeroCanvas` `LoadingFallback` reads it; exported pure `formatLoadingLabel(progress: number): string`.
- New `src/components/ControlsHint.tsx` (props: `mode: 'turntable'|'orbit'`, `visible`); dismissed state local to `HeroCanvas`.
- `useCapture.ts`: new pure `composeCaptureCanvas(source, caption, documentRef)` returning a canvas; `captureCanvas` accepts an optional caption `{ title }`; `CaptureButton` takes `caption`/`unitId`, tracks `savedFilename`.

## Failure behaviour
Offscreen 2D context unavailable -> fall back to saving the raw canvas (still `ok`). Progress unknown -> plain label. Capture errors keep existing codes.

## Acceptance criteria
- `Loading unit… 42%` style label while loading; plain once ready; unit-tested via `formatLoadingLabel`.
- Hint visible after ready, correct text per mode, dismiss button and first canvas interaction remove it; not shown during loading/error.
- Captured PNG is taller by the caption strip height and contains the title (unit-tested through the compose function with a stubbed canvas/context); filename matches the new pattern; "Saved …" status appears then clears.
- Mobile Playwright guard passes at 390x844; desktop Playwright flow unchanged.
- All commands in AGENTS.md pass except the known pre-existing environment failure (hologram-stage-switch test crashes on clean HEAD too), reported explicitly.

## Tests
`tests/loadingLabel.test.ts`, `tests/controlsHint.test.tsx`, `tests/capture.test.ts` (extended), `tests/app.smoke.spec.ts` (mobile guard, capture caption/status).
