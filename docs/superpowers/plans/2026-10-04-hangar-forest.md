# Hangar and Forest Implementation Plan

> For agentic workers: execute bounded tasks using subagents, with disjoint write scopes and review between tasks. No commits.

**Goal:** Build a maintenance bay and forest clearing around the selected model, replacing Space in the stage selector.

**Architecture:** Keep the existing stage record and selection flow. Add focused local backdrop components, Forest validation, per-stage camera defaults, and stage-specific fog/grid behavior.

**Tech stack:** React, TypeScript, React Three Fiber, Three.js, Vitest, Playwright.

## Task 1: Stage records and validation

Files: `src/app/types.ts`, `src/data/stages.ts`, `public/stages.json`, `tests/stages.test.ts`.

- [x] Add tests before production changes: Forest passes validation, bogus variants fail, and shipped IDs equal `['hangar', 'forest', 'ruined-city']`.

```ts
expect(validateStageRecord({ ...validRecord, backdrop: { variant: 'forest', particleCount: 0, motion: 0 } })?.backdrop.variant).toBe('forest');
expect(records.map(record => record.id)).toEqual(['hangar', 'forest', 'ruined-city']);
```

- [x] Run `npm run test -- tests/stages.test.ts`; expect new tests to fail because Forest is absent.
- [x] Add `'forest'` to the variant type and validator. Replace shipped Space record with Forest: background `#15251f`, gridColor `#314b36`, accentColor `#a5c880`, ambientIntensity `0.85`, directionalIntensity `1.25`, backdrop `{ variant: 'forest', particleCount: 0, motion: 0 }`. Keep legacy Space support.
- [x] Rerun the targeted test; expect all tests to pass. Review diff before task 2.

## Task 2: Local environments

Files: create `src/scene/HangarBackdrop.tsx`, `src/scene/ForestBackdrop.tsx`, `src/scene/environmentLayout.ts`, `tests/environmentLayout.test.ts`; modify `src/scene/StageBackdrop.tsx`.

- [x] Write layout tests before implementation. Validate repeatable tree/rock positions, multi-layer depth, central clearance, and bay dimensions that surround the 18m model.

```ts
expect(getForestLayout()).toEqual(getForestLayout());
expect(getForestLayout().trees.every(tree => Math.abs(tree.position[0]) > 12)).toBe(true);
expect(getHangarLayout().width).toBeGreaterThan(36);
```

- [x] Run `npm run test -- tests/environmentLayout.test.ts`; expect missing layout helper failure.
- [x] Implement deterministic local layouts. Use low-poly cylinders/cones for trees, low-poly rocks, a ground plane with path/clearing, and steel box geometry for walls/beams/catwalks/crates. Use meshStandardMaterial and emissive/basic light strips. Keep the central model envelope clear and overhead structure above its height. Bay must extend enough toward the camera to avoid exterior walls blocking fitted views on mobile.
- [x] Replace the old Hangar floor-ring component with imported HangarBackdrop and dispatch ForestBackdrop for `forest`; preserve City and legacy Space.
- [x] Rerun layout/stage tests; expect pass. Review diff before task 3.

## Task 3: Camera, atmosphere, and integration coverage

Files: `src/scene/HeroCanvas.tsx`, `src/scene/StageScene.tsx`, `tests/scene.test.tsx`, `tests/app.smoke.spec.ts`, `README.md`.

- [x] Add failing tests for Hangar/Forest camera direction and explicit overrides, Forest-only fog and hidden grid, stage switching through Forest and PNG download.

```ts
expect(getHeroCameraDefaults(forestStage).position[2]).toBeGreaterThan(20);
expect(getHeroCameraDefaults(forestStage, explicitCamera)).toEqual(explicitCamera);
await page.getByRole('button', { name: 'Forest stage' }).click();
await expect(page.locator('.hero-canvas')).toHaveAttribute('data-backdrop-variant', 'forest');
const download = page.waitForEvent('download');
await page.getByRole('button', { name: 'Capture PNG' }).click();
expect((await download).suggestedFilename()).toMatch(/\.png$/);
```

- [x] Run `npm run test -- tests/scene.test.tsx` and `npx playwright test`; expect new behavior assertions to fail before production edits.
- [x] Add Hangar/Forest camera profiles near `[8, 10, 34]` with target `[0, 6, 0]`, adjusting only if visual verification shows obstructed composition. Preserve City defaults and explicit overrides. Add Forest fog with explicit cleanup/reset across stage changes and hide its grid. Update browser tests to use Forest instead of Space and assert console/page errors, capture download, and mobile switching. Document the three environments.
- [x] Run focused tests; expect pass. Review changes.

## Task 4: Verification, review, screenshots

- [x] Run `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, in that order. All must pass before code review.
- [x] Use Playwright MCP at `http://127.0.0.1:4173/` (or Vite's reported next port). Click Haro Green, Hangar, Forest and Ruined City; inspect rendered canvas, capture, controls and console errors.
- [x] Dispatch reviewer against `git diff HEAD` and `git status --short` plus new files. Fix Critical/Important findings, rerun affected checks, and review again.
- [x] Capture Hangar and Forest final rendered screens via Playwright MCP into the external visualization directory. Deliver images, check results, review status and exact local URL. Preserve design/plan documents, leave all changes uncommitted.
