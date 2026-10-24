# Forest stage painted-sky look — Plan

Spec: `docs/superpowers/specs/2026-10-24-forest-obsolete-sky-design.md`
Verification: `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, secret check, browser check on http://127.0.0.1:4173 (Forest stage, Light Guncannon selected).

## Task 1 — Stage data and camera (TDD)
Files: `public/stages.json`, `tests/stages.test.ts`, `src/scene/HeroCanvas.tsx`, `tests/scene.test.tsx`.
1. Update tests: Forest stage values (bright background, higher light intensities) and new `forestCamera` constants; run `npx vitest run tests/stages.test.ts tests/scene.test.tsx` — expect failures.
2. Change `stages.json` and `forestCamera`; re-run — expect pass.

## Task 2 — Trees and layout (TDD)
Files: `src/scene/environmentLayout.ts`, `src/scene/ForestBackdrop.tsx`, `tests/environmentLayout.test.ts`.
1. Add failing assertions for canopy fields and brighter palette; run — expect failure.
2. Implement round-canopy trees, brighter ground and horizon tree line; run — expect pass.

## Task 3 — Painted sky dome (TDD)
Files: new `src/scene/SkyDome.tsx`, `src/scene/StageScene.tsx` or `ForestBackdrop.tsx`, `tests/scene.test.tsx`.
1. Failing tests: sky dome renders only for Forest; fog colour follows `stage.background`; missing canvas context falls back without throwing.
2. Implement the procedural texture (gradient + streaky cloud bands) and dome; run tests — expect pass.

## Task 4 — Tune in the browser
Start Vite on 4173, select Forest + Light Guncannon, compare with the reference frame, adjust camera, colours, fog and cloud streaks. Re-run affected tests after each change.

## Task 5 — Verify, review, capture
1. Run all four verification commands and the secret check.
2. Playwright MCP: open Forest stage, capture the screen, confirm no console errors.
3. Run code-review on `git diff HEAD`; fix Critical/Important findings.
4. Leave everything uncommitted until asked.
