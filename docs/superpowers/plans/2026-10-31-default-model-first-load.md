# Default Model on First Load — Implementation Plan

Spec: `docs/superpowers/specs/2026-10-31-default-model-first-load-design.md`. No commits (user commits).

## Verification commands (from AGENTS.md)
`npx tsc -b --pretty false` · `npm run test` · `npm run build` · `npx playwright test`, then secret check, Playwright MCP check at the Vite URL (port 4173 if free), code-review skill on `git diff HEAD`.

## Tasks (sequential; each reviewed before the next)

### Task 1 — Reducer: retry action (scope: `src/state/tacticalState.ts`, new `tests/tacticalState.test.ts`)
1. Write failing tests: `retry-unit` sets `loading` and bumps `loadRequestId` when a unit is selected; no-op when none; old requestId `unit-error` ignored afterwards.
2. Run `npm run test` -> expect failures.
3. Add the action/case. Run tests -> pass.

### Task 2 — App: auto-select first unit (scope: `src/app/App.tsx`, `tests/app.test.tsx`)
1. Update tests: first load shows first unit title + "Loading unit…" with no click; later selection of a second unit sticks; remove the assertion of the "Select a unit…" prompt on first visit.
2. Run tests -> expect failures.
3. Add effect: when `collectionStatus === 'ready' && state.selectedUnitId === null && records.length` dispatch `select-unit` with `records[0].id`. Run tests -> pass.

### Task 3 — Retry UI (scope: `src/app/App.tsx`, `src/app/app.css`, `tests/app.test.tsx`)
1. Failing test: when a unit error occurs, a "Retry loading model" button appears; clicking it removes the alert and shows loading.
2. Implement button (calls `useGLTF.clear(selectedUnit.model)` from `@react-three/drei`, then `retry-unit`); minimal styling matching existing buttons.
3. Run tests -> pass.

### Task 4 — E2E + full verification (scope: `tests/app.smoke.spec.ts`)
1. Adjust smoke tests so they no longer require a click to load Light Guncannon; assert canvas visible and model response without clicking.
2. Run all four verification commands; expected: all green.
3. Playwright MCP: open the URL, confirm model renders without interaction, check console errors, capture screenshot.
4. Secret check, code review (`git diff HEAD`), fix Critical/Important, report.

## Loop (/loop, self-paced)
Per iteration: implement the next task via TDD -> run its tests -> run full verification -> review. Stop when all four tasks are done and no Critical/Important findings remain; stop and report on any command failure that two attempts cannot fix.
