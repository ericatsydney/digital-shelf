# Ruined City Street Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset the 3D hero camera to a street-facing Ruined City composition whenever the tactical stage is selected, while preserving model fitting and controls.

**Architecture:** Add a reducer-owned camera reset revision that changes on every stage selection. Pass it through `App` to `HeroCanvas`, where the existing camera-fit effect will reapply the selected stage/unit camera profile and preserve its viewing direction while fitting the model bounds.

**Tech Stack:** React, React Three Fiber, Three.js, TypeScript, Vitest, Testing Library, Playwright.

---

### Task 1: Add reducer camera-reset coverage

**Files:**
- Modify: `src/state/tacticalState.ts`
- Test: `tests/tacticalState.test.ts`

- [ ] **Step 1: Inspect the existing reducer test setup**

Read `tests/tacticalState.test.ts` and use its existing `initialTacticalState`/`tacticalReducer` test style. Keep all current action assertions intact.

- [ ] **Step 2: Write the failing test**

Add a test with this behavior:

```ts
it('increments the camera reset revision for every stage selection', () => {
  const first = tacticalReducer(initialTacticalState, {
    type: 'select-stage',
    stageId: 'ruined-city',
  });
  const second = tacticalReducer(first, {
    type: 'select-stage',
    stageId: 'ruined-city',
  });

  expect(first.stageId).toBe('ruined-city');
  expect(first.cameraResetId).toBe(initialTacticalState.cameraResetId + 1);
  expect(second.cameraResetId).toBe(first.cameraResetId + 1);
});
```

- [ ] **Step 3: Run the focused test and confirm it fails**

Run: `npm run test -- tests/tacticalState.test.ts`

Expected: FAIL because `cameraResetId` is not present in `TacticalState` or the reducer output.

- [ ] **Step 4: Implement the minimal reducer change**

Add `cameraResetId: number` to `TacticalState`, initialize it to `0`, and update the `select-stage` branch to return:

```ts
return {
  ...state,
  stageId: action.stageId,
  cameraResetId: state.cameraResetId + 1,
};
```

- [ ] **Step 5: Run the focused test**

Run: `npm run test -- tests/tacticalState.test.ts`

Expected: PASS.

### Task 2: Implement street-facing camera reset and test the camera contract

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/scene/HeroCanvas.tsx`
- Test: `tests/scene.test.tsx`

- [ ] **Step 1: Write failing camera-profile assertions**

Update the existing Ruined City camera-default test for the concrete preset `position: [10, 12, 34]` and `target: [0, 5, 0]`. This places the camera at the positive-Z end of the road, with a modest X offset and a downward viewing angle. Assert the explicit camera override test remains unchanged:

```tsx
it('uses a street-facing city framing aligned with the roadway', () => {
  const camera = getHeroCameraDefaults(ruinedCityStage);
  const direction = new Vector3(...camera.target).sub(new Vector3(...camera.position)).normalize();

  expect(Math.abs(direction.z)).toBeGreaterThan(Math.abs(direction.x) * 2);
  expect(direction.y).toBeLessThan(0);
  expect(camera.position[1]).toBeGreaterThan(camera.target[1]);
});
```

Add `cameraResetId={0}` to the existing `HeroCanvas` render test so the component contract is explicit. Keep the assertion that the model and OrbitControls render; the reset revision is covered behaviorally by the reducer test and by the camera-fit effect dependency in the implementation.

- [ ] **Step 2: Run the focused scene tests and confirm the new assertion fails**

Run: `npm run test -- tests/scene.test.tsx`

Expected: FAIL because the current `[42, 28, 54]` profile is too diagonal and the component does not yet accept a reset ID.

- [ ] **Step 3: Add the reset ID to the app-to-canvas data flow**

Pass `cameraResetId={state.cameraResetId}` from `App` to `HeroCanvas`. Add `cameraResetId: number` to `HeroCanvasProps` and include it in the `HeroCameraFit` props/dependency list. Keep it as a camera-reset trigger only; do not include it in the model request key or loading state.

- [ ] **Step 4: Replace the Ruined City fallback profile**

Update `ruinedCityCamera` in `HeroCanvas.tsx` to this exact profile:

```ts
const ruinedCityCamera: HeroCameraDefaults = {
  position: [10, 12, 34],
  target: [0, 5, 0],
};
```

Keep `getHeroCameraDefaults` precedence exactly as follows:

```ts
if (camera) return camera;
return stage.backdrop.variant === 'ruined-city' ? ruinedCityCamera : defaultCamera;
```

The existing `getCameraFit` implementation should continue to derive the fitted position from the fallback direction and aim at the loaded model bounds center.

- [ ] **Step 5: Make the camera-fit effect respond to stage selection**

Pass the reset ID into `HeroCameraFit` and add it to the effect dependency array. When the stage selection changes, the effect must set the camera position, call `lookAt`, update the projection matrix, set the OrbitControls target, and call `update()` exactly as it does for model-bound changes.

- [ ] **Step 6: Run focused tests**

Run: `npm run test -- tests/scene.test.tsx tests/tacticalState.test.ts`

Expected: PASS, including street direction, explicit camera precedence, camera-fit fallback, model rendering, and reducer reset coverage.

### Task 3: Full verification and user-perspective check

**Files:**
- Verify: `src/app/App.tsx`
- Verify: `src/scene/HeroCanvas.tsx`
- Verify: `src/state/tacticalState.ts`
- Verify: `tests/scene.test.tsx`
- Verify: `tests/tacticalState.test.ts`

- [ ] **Step 1: Run type-checking**

Run: `npx tsc -b --pretty false`

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Run the full unit test suite**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Build the application**

Run: `npm run build`

Expected: PASS with a production Vite build.

- [ ] **Step 4: Run Playwright tests**

Run: `npx playwright test`

Expected: PASS.

- [ ] **Step 5: Start Vite for visual verification**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Expected: Vite serves the app at `http://127.0.0.1:4173/`, or reports the next available port without terminating an existing process.

- [ ] **Step 6: Verify the requested flow in Playwright MCP**

Open the exact local URL, select the `Haro Green` roster button, click the `Ruined City` tactical-stage button, and confirm:

- the hero canvas is visible;
- Haro is visible and not clipped;
- the street recedes through the camera view;
- OrbitControls remain available;
- the browser console has no errors.

Capture the final rendered screen for the completion report.

- [ ] **Step 7: Review the working tree**

Run:

```powershell
git diff HEAD -- src/app/App.tsx src/scene/HeroCanvas.tsx src/state/tacticalState.ts tests/scene.test.tsx tests/tacticalState.test.ts
git status --short
```

Expected: only the requested camera behavior, tests, and the intentionally uncommitted spec/plan documents are present. Do not create a commit.
