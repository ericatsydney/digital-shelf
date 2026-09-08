# Ruined City Street-Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven development when available, or execute this plan task-by-task with review checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing `ruined-city` backdrop into a street canyon that supports an 18 m Haro and add optional `heightMeters` metadata for robot records.

**Architecture:** Keep stage selection and JSON contracts intact. Add optional height validation to collection records, normalize loaded model geometry to the declared height while preserving authored display scale, and replace only the `ruined-city` backdrop geometry with deterministic six-lane road/building primitives. Keep Hangar, Space, reduced-motion behavior, and existing fallback paths unchanged.

**Tech Stack:** React, TypeScript, React Three Fiber, Three.js, Vitest, Testing Library, Playwright, Vite.

---

## File map

- Modify `src/app/types.ts`: add optional `heightMeters` to `CollectionRecord`.
- Modify `src/data/collection.ts`: validate positive finite heights while preserving missing-height compatibility.
- Modify `public/collection.json`: declare Haro at 18 meters.
- Modify `src/scene/HeroModel.tsx`: measure the loaded GLTF bounds and compute height-aware scale with authored fallback behavior.
- Modify `src/scene/HeroCanvas.tsx`: provide city-specific framing/target defaults without changing non-city stages.
- Modify `src/scene/StageBackdrop.tsx`: replace the ruined-city box row with street, sidewalk, curb, lane-marking, building, window, and deployment-pad primitives.
- Modify `src/app/app.css`: tune only the existing ruined-city overlay treatment if needed after the 3D street is visible; preserve reduced-motion rules.
- Modify `tests/collection.test.ts`: add height validation coverage.
- Modify `tests/scene.test.tsx`: add scene regression coverage for height-aware model behavior where practical.
- Modify `tests/stages.test.ts`: preserve and extend ruined-city stage validation coverage if the backdrop config changes.
- Modify `tests/app.smoke.spec.ts` or the appropriate existing smoke spec: verify the Ruined City stage and Haro remain usable in a browser.

## Task 1: Add failing collection metadata tests

**Files:**
- Test: `tests/collection.test.ts`

- [ ] **Step 1: Inspect the existing collection test conventions.**

Run:

```powershell
Get-Content -Raw tests\collection.test.ts
```

Use the existing `validateCollectionRecord` tests and fixtures rather than introducing a new test helper.

- [ ] **Step 2: Add failing tests for the new contract.**

Add cases equivalent to:

```ts
it('accepts a positive finite heightMeters value', () => {
  expect(validateCollectionRecord({
    id: 'haro-green', title: 'Haro Green', category: 'Figure', model: '/models/haro-green.glb', heightMeters: 18,
  })).toMatchObject({ heightMeters: 18 });
});

it('accepts records without heightMeters for backward compatibility', () => {
  expect(validateCollectionRecord({
    id: 'legacy', title: 'Legacy', category: 'Figure', model: '/models/legacy.glb',
  })).not.toBeNull();
});

it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid heightMeters: %s', (heightMeters) => {
  expect(validateCollectionRecord({
    id: 'invalid', title: 'Invalid', category: 'Figure', model: '/models/invalid.glb', heightMeters,
  })).toBeNull();
});
```

- [ ] **Step 3: Run the focused test and verify the invalid cases fail.**

Run:

```powershell
npm run test -- tests/collection.test.ts
```

Expected: the invalid-height assertions fail until explicit validation is added.

## Task 2: Implement and verify height metadata

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/data/collection.ts`
- Modify: `public/collection.json`
- Test: `tests/collection.test.ts`

- [ ] **Step 1: Add the optional type field.**

In `CollectionRecord`, add:

```ts
heightMeters?: number;
```

- [ ] **Step 2: Add a positive finite number guard and validation.**

Use the existing validation style:

```ts
const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;
```

Before returning the record, reject an explicitly present invalid field:

```ts
if (record.heightMeters !== undefined && !isPositiveFiniteNumber(record.heightMeters)) return null;
```

Return the typed field as part of the existing record cast; do not default missing heights.

- [ ] **Step 3: Add Haro’s height to the JSON fixture.**

Update the Haro object in `public/collection.json` to include:

```json
"heightMeters": 18
```

- [ ] **Step 4: Run the collection tests.**

Run:

```powershell
npm run test -- tests/collection.test.ts
```

Expected: PASS.

## Task 3: Add failing model-scale tests and implement height normalization

**Files:**
- Modify: `src/scene/HeroModel.tsx`
- Test: `tests/scene.test.tsx`

- [ ] **Step 1: Add a pure scale-helper test seam.**

Extract or export a pure helper with this contract:

```ts
export function getHeightAwareScale(
  measuredHeight: number,
  heightMeters: number | undefined,
  authoredScale: number,
): number;
```

Required behavior:

```ts
getHeightAwareScale(2, 18, 1) === 9;
getHeightAwareScale(2, 18, 1.25) === 11.25;
getHeightAwareScale(2, undefined, 1.25) === 1.25;
getHeightAwareScale(0, 18, 1.25) === 1.25;
```

- [ ] **Step 2: Run the focused scene test and verify the new assertions fail.**

Run:

```powershell
npm run test -- tests/scene.test.tsx
```

Expected: FAIL until the helper and `HeroModel` use the height-aware rule.

- [ ] **Step 3: Implement the pure scale helper.**

Use target height divided by measured source height, multiplied by authored scale. Treat non-positive/non-finite measured heights or missing/non-positive metadata as authored-scale fallback.

- [ ] **Step 4: Measure the loaded GLTF scene and apply the result.**

In `HeroModel`, safely inspect the loaded scene with a Three.js `Box3`, compute its height, and set the group scale to the helper result. Keep `onLoaded()` behavior unchanged. Do not mutate shared geometry or remove the existing `display.scale` fallback.

- [ ] **Step 5: Run the focused scene tests.**

Run:

```powershell
npm run test -- tests/scene.test.tsx
```

Expected: PASS.

## Task 4: Build the six-lane street-canyon ruined-city backdrop

**Files:**
- Modify: `src/scene/StageBackdrop.tsx`
- Test: `tests/stages.test.ts`

- [ ] **Step 1: Add a failing structural expectation for the existing ruined-city config.**

Keep the stage variant as `'ruined-city'` and assert that the existing JSON record continues to validate. Do not add a new variant or alter Hangar/Space validation.

- [ ] **Step 2: Replace the current ruined-city building row with focused primitives.**

Refactor the current `RuinedCityBackdrop` into local helpers with clear responsibilities:

```tsx
function StreetSurface({ color }: { color: string }) { /* road plane and lane markings */ }
function Sidewalk({ side, color }: { side: -1 | 1; color: string }) { /* curb/sidewalk */ }
function CityBuilding({ building, color }: { building: Building; color: string }) { /* mass + windows */ }
function StreetCanyonBackdrop({ color, config }: { color: string; config: StageBackdropConfig }) { /* composition */ }
```

Use deterministic arrays for approximately 3–4 buildings per side. Size the roadway at 19.8 m wide for six approximately 3.3 m lanes, add a 0.8–1.2 m center divider, and size each sidewalk at approximately 2.4 m wide. Buildings should use 10–18 m widths, 12–24 m depths, and 18–32 m heights based on 5–8 storeys at approximately 3.6–4.0 m per storey. Each building should have position, size, color variation, and a small number of warm window strips. Keep geometry lightweight: boxes, planes, and thin basic-material strips only.

Use a central road aligned with the current scene axes, keep the street deployment zone clear, and preserve the existing scan ring/animation path with reduced motion forcing `motion: 0` through the existing `effectiveConfig` flow.

- [ ] **Step 3: Keep the switch wired to the existing variant.**

Change only the `case 'ruined-city'` renderer target from the old implementation to the new street-canyon component. Leave `space`, `hangar`, and the default branch unchanged.

- [ ] **Step 4: Run stage and scene tests.**

Run:

```powershell
npm run test -- tests/stages.test.ts tests/scene.test.tsx
```

Expected: PASS.

## Task 5: Add city deployment framing for the full street corridor

**Files:**
- Modify: `src/scene/HeroCanvas.tsx`
- Test: `tests/scene.test.tsx`

- [ ] **Step 1: Add a failing assertion for city-stage camera defaults.**

Use the existing mocked `Canvas` props or extract a pure camera-default helper. The required rule is: when `stage.backdrop.variant === 'ruined-city'` and the record has no explicit camera, use a wider/farther framing that shows an 18 m model, the approximately 25–26 m street corridor, and building context; explicit per-record camera values still win.

- [ ] **Step 2: Implement the narrow city-only camera rule.**

Keep the current default for Hangar/Space. For Ruined City, use a farther camera position and a target centered slightly above the road plane. Do not alter OrbitControls capabilities.

- [ ] **Step 3: Run the focused scene tests.**

Run:

```powershell
npm run test -- tests/scene.test.tsx
```

Expected: PASS.

## Task 6: Browser smoke verification and visual polish

**Files:**
- Modify: `src/app/app.css` only if the rendered overlay needs city-specific contrast tuning.
- Test: `tests/app.smoke.spec.ts` or the existing appropriate Playwright smoke file.

- [ ] **Step 1: Add a browser assertion for the existing stage and Haro.**

Verify the app loads, the Haro roster item is present, the Ruined City stage can be selected, and the canvas/status remains usable. Do not assert fragile Three.js internals; assert user-visible stage controls and absence of a model error.

- [ ] **Step 2: Run the browser smoke test.**

Run:

```powershell
npx playwright test
```

Expected: PASS.

- [ ] **Step 3: Start the required local verification server.**

Run:

```powershell
npm run dev -- --host 127.0.0.1 --port 4173
```

If port 4173 is occupied, leave the existing process alone, use Vite’s next available port, and record the exact URL.

- [ ] **Step 4: Visually inspect the city stage.**

Confirm the central street, side buildings, lane markings, Haro scale, camera framing, and readable contrast against the supplied reference direction. Check Hangar and Space once to ensure their existing treatment remains intact. Check reduced-motion behavior if available.

## Task 7: Full verification and review gate

- [ ] **Step 1: Run the complete required verification sequence.**

Run each command separately:

```powershell
npx tsc -b --pretty false
npm run test
npm run build
npx playwright test
```

Expected: all commands pass. Do not proceed to code review if any command fails.

- [ ] **Step 2: Review the working-tree diff and status.**

Run:

```powershell
git diff HEAD
git status --short
```

Confirm only intended source/test/data changes plus the intentionally uncommitted spec and plan are present. Preserve unrelated user changes if any appear.

- [ ] **Step 3: Run the code-review skill against the final diff.**

Review for critical and important findings. Fix any such findings, rerun affected tests, and repeat the review. Report minor findings without blocking completion.

- [ ] **Step 4: Leave workflow documents uncommitted.**

Per `AGENTS.md`, leave `docs/superpowers/specs/2026-09-08-ruined-city-street-scale-design.md` and this plan uncommitted. Do not create a commit unless the user explicitly requests it.
