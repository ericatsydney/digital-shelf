# Ruined City realistic restyle — Plan

Spec: `docs/superpowers/specs/2026-10-24-ruined-city-realistic-design.md`
Verification: `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, secret check, browser check on http://127.0.0.1:4173 (Ruined City, Light Guncannon selected).

## Task 1 — Extract the module (refactor, tests stay green)
Files: new `src/scene/RuinedCityBackdrop.tsx`, `src/scene/StageBackdrop.tsx`.
Move street/building code, re-export the two layout functions, run `npx vitest run` — expect unchanged results.

## Task 2 — Building data model (TDD)
Files: `RuinedCityBackdrop.tsx`, `tests/stages.test.ts`.
Failing tests for roof/balcony/window/damage fields (deterministic, within limits) -> implement -> pass.

## Task 3 — Facade parts and street (TDD)
Files: `RuinedCityBackdrop.tsx`, `tests/backdropMaterials.test.tsx`.
Rewrite city material tests (rough, non-metal, no scan ring/pad/emissive windows) -> implement arched windows, balconies, roofs, shell holes, rubble, cracked asphalt, wrecks using instancing for repeated parts.

## Task 4 — Sky, smoke, light, camera (TDD)
Files: `src/scene/SkyDome.tsx`, `src/scene/StageScene.tsx`, `public/stages.json`, `src/scene/HeroCanvas.tsx`, `tests/scene.test.tsx`, `tests/stages.test.ts`.
Failing tests: sky dome for Ruined City, new stage values, new camera -> implement daylight palette, smoke columns, lights, camera -> pass.

## Task 5 — Tune in the browser
Vite on 4173; select Ruined City + Light Guncannon; compare with the reference frame; adjust colours, damage, smoke, camera, fog. Watch the stage-cycling Playwright test time.

## Task 6 — Verify, review, capture
Run all four commands and the secret check; Playwright MCP capture of the Ruined City with no console errors; code-review on `git diff HEAD`; fix Critical/Important findings; leave uncommitted until asked.
