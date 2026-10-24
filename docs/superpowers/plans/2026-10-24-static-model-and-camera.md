# Static robot scale and camera — Plan

Spec: `docs/superpowers/specs/2026-10-24-static-model-and-camera-design.md`
Verification: `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, secret check, browser check on http://127.0.0.1:4173.

## Task 1 — Record fields (TDD)
Files: `src/app/types.ts`, `src/data/collection.ts`, `tests/collection.test.ts`.
Failing tests for `display.scale`/`display.groundOffset` validation, then implement.

## Task 2 — Measure the existing GLBs offline
Files: scratch script only; `public/collection.json`.
Measure `light-guncannon.glb` and `hyaku-shiki.glb` with gltf-transform (decode Meshopt), compute scale and offset from their `heightMeters`, write them into `collection.json`.

## Task 3 — Static HeroModel (TDD)
Files: `src/scene/HeroModel.tsx`, `tests/scene.test.tsx`.
Failing tests that the group uses the stored scale/offset and never measures; remove the measuring helpers and `onBounds`; update HeroCanvas call sites.

## Task 4 — Fixed cameras (TDD)
Files: `src/scene/HeroCanvas.tsx`, `tests/scene.test.tsx`.
Failing tests for fixed per-stage defaults, unit override, order independence; remove `getCameraFit`, `HeroCameraFit`, `modelBounds`; add the small camera rig effect (stage, unit camera, `cameraResetId`).

## Task 5 — Generator writes the values (TDD)
Files: `tools/model-generator/*`, `tests/modelGenerator/*`, `README.md`.
Failing tests for measured scale/offset in the new record and the no-height and unmeasurable cases; implement a `measureGlb` helper with gltf-transform; document it.

## Task 6 — Tune in the browser
Vite on 4173; check each stage's fixed camera framing (Ruined City value especially); switch robot and stage in many orders with Playwright, comparing robot pixel height to first load.

## Task 7 — Verify and review
Four commands, secret check, code-review on `git diff HEAD`, fix Critical/Important findings; leave uncommitted until asked.
