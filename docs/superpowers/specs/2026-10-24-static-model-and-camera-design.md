# Static robot scale and camera — Design

## Problem
The robot sometimes renders far too small after switching robots or stages. Its scale is measured at runtime from the cached glTF scene, and the camera is fitted at runtime from bounds held in React state; either can be stale or wrong when models and stages are switched in some orders.

## Goal
Render the robot and stage at fixed, authored sizes. Nothing is measured or fitted on the fly.

## Reuse check
`@gltf-transform/functions` (already a dependency, used for Meshopt compression) measures GLB bounds offline. No new dependency.

## Requirements
1. **Record data:** `display.scale` and `display.groundOffset` (native units, added before scaling) are stored in `public/collection.json` for every model. They are validated in `src/data/collection.ts` (finite numbers, scale > 0).
2. **HeroModel:** applies `scale = display.scale ?? 1` and `position.y = display.groundOffset ?? 0`. No `Box3`/measurement, no `onBounds`. `getHeightAwareScale`, `getIntrinsicBounds` and the runtime bounds plumbing are removed. `heightMeters` stays as documentation only.
3. **Camera:** `getCameraFit`, `HeroCameraFit` and the `modelBounds` state are removed. Fixed per-stage defaults (position, target) tuned for a ~20 m robot: Hangar `[11.2, 15.9, 47.5]` to `[0, 10.3, 0]`; Forest `[-11.1, 3.3, 47.3]` to `[0, 10.3, 0]`; Ruined City the equivalent value (position about `[3, 3.3, 47.3]`, tuned in the browser). A unit's `camera` override still wins. A small rig effect applies the defaults on stage/unit/`cameraResetId` change and resets the OrbitControls target (Hangar spin mode keeps zoom-only controls).
4. **Generator:** `model:generate` measures the raw GLB with gltf-transform (`getBounds` of the default scene) before compression, computes `scale = heightMeters / (max.y - min.y)` and `groundOffset = -min.y`, and writes them to the new record's `display`. Without `--height` only `groundOffset` is written (scale 1).
5. **Existing models:** compute and write the two values for `light-guncannon` and `hyaku-shiki` (the old runtime values: Light Guncannon scale about 20.6 and offset 1.0 if native height is 1.0 m, etc.; measured offline from the GLBs, not guessed).

## Exclusions
Stage scenery, controls behaviour, spin behaviour, UI, other models' appearance. Robots far outside ~15-25 m need their own `camera` override.

## Failure behaviour
Missing or invalid `display` values fall back to scale 1 and offset 0 (the app still renders); invalid values (non-finite, scale <= 0) skip the record via existing collection validation with a message. The generator errors clearly if the GLB has no measurable bounds, before installing anything.

## Acceptance criteria
- `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` pass; secret check prints nothing.
- A unit test proves identical scale and camera for the same unit/stage regardless of switching order.
- Browser: switching robot x stage in many orders (including Hangar to Forest to City to Hangar, and Hyaku-Shiki to Light Guncannon) always shows the same robot size as first load; no console errors.

## Tests
- `tests/collection.test.ts`: validation of the new `display` fields.
- `tests/scene.test.tsx`: HeroModel applies stored scale/offset; fixed camera defaults per stage; unit override wins; order independence.
- `tests/modelGenerator/*`: measured scale/offset written to the record; no-height case; unmeasurable GLB error.
