# Default Model on First Load — Design

**Date:** 2026-10-31
**Status:** Draft for user review (no code written)
**Source:** `docs/2026-10-31-ceo-product-review.md`, short-term goal "improve the first session".

## Problem
On every visit the hero display is empty ("Select a unit from the roster to view it.") until the visitor picks a roster entry. The first impression is an empty canvas.

## Reuse check
No library or service is needed: the change is a small state-initialisation tweak to the existing reducer/App. Nothing to adopt.

## Decisions (approved in chat)
- Every visit starts from a **clean default**: first roster record, default stage. No persistence (localStorage etc.).

## Requirements
1. When the collection loads with >=1 valid record and nothing is selected, the first record is selected automatically (dispatch `select-unit`), so the model starts loading with the existing "Loading unit…" status.
2. The auto-selection happens once; a later user selection is never overridden. Re-renders or collection reloads do not reset the user's choice.
3. The title/eyebrow show the selected unit; the "Select a unit…" prompt is no longer the first-visit state.
4. Model load failure shows the existing "Model unavailable" alert **plus a Retry button** that re-requests the same unit (new `loadRequestId`, status back to `loading`, GLTF cache entry cleared so the fetch repeats).
5. Collection `empty` / `error` / `loading` states are unchanged.

## Exclusions
Persisting last model/stage, loading progress percentage, mobile layout, controls hint, capture changes, analytics (separate tasks).

## Interfaces
- `tacticalReducer`: new action `{ type: 'retry-unit' }` -> `unitStatus: 'loading'`, `loadRequestId + 1`, only when `selectedUnitId` is set.
- `App`: the collection loader dispatches `select-unit` for `records[0]` in the same batch as `setRecords`, so the empty prompt never flashes (an effect would render one empty frame).
- `App`: Retry button (`aria-label` "Retry loading model") rendered next to the error alert; on click calls `useGLTF.clear(model)` then dispatches `retry-unit`.

## Failure behaviour
- Auto-selected model fails to load -> error alert + Retry; stage switcher and roster stay usable.
- Retry that fails again -> same state, can retry again.

## Acceptance criteria
- Fresh load with a 2-unit collection shows the first unit's title as the H1 and "Loading unit…" without any click; the "Select a unit…" prompt is absent.
- Clicking another roster entry after auto-selection switches to it and it stays selected.
- Error state shows a Retry button; clicking it returns to loading and increments the request.
- Existing tests are updated where they assumed an empty first state; all verification commands pass.
- Playwright: page opens with Light Guncannon visible in the 3D canvas with no click, no console errors.

## Tests
- Reducer unit tests: `retry-unit` (with/without selection), stale ready/error after retry ignored.
- `tests/app.test.tsx`: auto-select on load; user choice not overridden; Retry button appears on `unit-error` path.
- `tests/app.smoke.spec.ts`: model request fires and canvas shows without clicking.
