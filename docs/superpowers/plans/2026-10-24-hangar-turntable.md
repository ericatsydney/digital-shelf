# Hangar turntable + painted wall — Plan

Spec: `docs/superpowers/specs/2026-10-24-hangar-turntable-design.md`
Verification: `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, secret check, browser check on http://127.0.0.1:4173 (Hangar, Light Guncannon).

## Task 1 — Controls mode (TDD)
Files: `src/scene/HeroCanvas.tsx`, `tests/scene.test.tsx`.
Failing tests for `getHeroControlsMode`; implement it; wrap model + platform in `PresentationControls` for the turntable mode and set `OrbitControls` rotate/pan off there. Run `npx vitest run tests/scene.test.tsx`.

## Task 2 — Turntable (TDD)
Files: new `src/scene/Turntable.tsx`, `tests/backdropMaterials.test.tsx` (or scene test).
Test for the platform parts (rough surfaces, accent ring luminous) then implement; mount it inside the rotating group.

## Task 3 — Static wall pattern (TDD)
Files: new `src/scene/hangarWallTexture.ts`, `tests/hangarWallTexture.test.ts`, `src/scene/HangarBackdrop.tsx`, `tests/backdropMaterials.test.tsx`.
Tests for deterministic layout data and null fallback; implement the painter; replace the 3D wall boxes with textured planes (cached texture); update the Hangar material tests.

## Task 4 — Floor and light
Files: `src/scene/HangarBackdrop.tsx`, `public/stages.json`, `tests/stages.test.ts`.
Floor seams, darker cool lighting; update stage-value tests.

## Task 5 — Tune in the browser
Vite on 4173; Hangar + Light Guncannon; compare with the reference; verify drag-to-spin, zoom, no console errors; check the stage-cycling test time.

## Task 6 — Verify and review
Run the four commands and the secret check; Playwright MCP capture; code-review on `git diff HEAD`; fix Critical/Important findings; leave uncommitted until asked.
