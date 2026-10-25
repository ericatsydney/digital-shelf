# Forest tree wind sway - design

## Goal
Make Forest stage trees sway gently in the wind. Trees only; grass, ferns, city and hangar are out of scope (a later iteration judges the effect first).

## Reuse check
three.js examples (foliage/grass/instancing demos) use a vertex-shader sway; no library needed. Chosen: patch the existing `meshStandardMaterial`s with `onBeforeCompile`, no new dependency. Rejected: per-tree CPU rotation (stiff, 68 updates/frame).

## Requirements
- `src/scene/windMaterial.ts`: shared time uniform, `treeHeightFraction`/`swayWeight` helpers, `applyWind(shader, params)` that injects a vertex-shader displacement.
- Displacement is along a fixed wind direction in world space, weighted by `swayWeight(heightFraction)` (0 at the trunk base, 1 at the canopy top, eased with a power curve), with per-tree phase from the mesh world position and a slow gust term layered over a faster sway.
- `ForestBackdrop.tsx` Tree/horizon trunks and canopies use `onBeforeCompile`; strength is lower for horizon trees (layer 3).
- Time advances through the mesh `onBeforeRender` (no hooks, keeps existing element-tree tests valid).
- `prefers-reduced-motion: reduce` disables the sway (amount uniform 0).

## Failure behaviour
If the shader chunk marker is missing in a future three version, `applyWind` leaves the shader unchanged and trees render static.

## Acceptance criteria
- Trunk base never moves; canopy top moves most; neighbouring trees are out of phase.
- Other stages unchanged; no console errors.
- tsc, vitest, build and Playwright pass; screenshot captured.

## Tests
Unit: `swayWeight` is 0 at base, monotonic, 1 at top; `applyWind` injects uniforms and the displacement into the vertex shader and tolerates a shader without the marker. Existing element-tree and Playwright tests stay green.
