# Fit 3D Model to Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically fit the loaded Three.js model inside the hero canvas without changing its authored scale.

**Architecture:** `HeroModel` reports its effective bounding box upward. `HeroCanvas` owns the fit calculation and passes bounds into a small React Three Fiber camera-fit component that updates the camera and orbit target while preserving the existing camera direction and stage composition.

**Tech Stack:** React, React Three Fiber, Drei OrbitControls, Three.js `Box3`/`Sphere`, Vitest, Testing Library, Playwright MCP.

---

### Task 1: Add failing camera-fit helper tests

**Files:**
- Modify: `tests/scene.test.tsx`
- Test: `tests/scene.test.tsx`

- [ ] **Step 1: Write the failing tests**

Import the Three.js `Box3` and `Vector3`, and add tests for an exported `getCameraFit` helper:

```tsx
import { Box3, Vector3 } from 'three';
import { getCameraFit } from '../src/scene/HeroCanvas';

describe('getCameraFit', () => {
  it('returns a target at the bounds center and a distance that contains the model', () => {
    const fit = getCameraFit(
      new Box3(new Vector3(-1, -2, -1), new Vector3(1, 2, 1)),
      [4, 2.5, 6],
      42,
    );

    expect(fit.target).toEqual([0, 0, 0]);
    expect(fit.position[1]).toBeGreaterThan(0);
    expect(fit.position[2]).toBeGreaterThan(6);
  });

  it('falls back to the provided camera when bounds are invalid', () => {
    const fallback = { position: [4, 2.5, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number] };

    expect(getCameraFit(new Box3(), fallback.position, 42)).toEqual(fallback);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test -- tests/scene.test.tsx`

Expected: FAIL because `getCameraFit` is not exported yet.

### Task 2: Implement model-bounds reporting and camera fitting

**Files:**
- Modify: `src/scene/HeroModel.tsx`
- Modify: `src/scene/HeroCanvas.tsx`
- Modify: `tests/scene.test.tsx`

- [ ] **Step 1: Extend `HeroModel` with an optional bounds callback**

Add `onBounds?: (bounds: Box3) => void` to `HeroModelProps`. After computing the effective scale, create a scaled copy of the measured bounds and call `onBounds` from the existing load effect. Keep `onLoaded()` in the same effect so the current loading contract remains unchanged.

- [ ] **Step 2: Add the pure `getCameraFit` helper**

Export a helper in `HeroCanvas.tsx` that:

1. Validates the bounds.
2. Finds the bounds center and bounding-sphere radius.
3. Calculates a safe distance using the perspective field of view in radians and a `1.25` framing margin.
4. Preserves the normalized direction from the fallback camera position to its fallback target.
5. Returns fallback camera values for invalid bounds.

The return type must remain compatible with the existing `HeroCameraDefaults` tuple types.

- [ ] **Step 3: Add a camera-fit component inside the R3F canvas**

Create a focused `HeroCameraFit` component in `HeroCanvas.tsx` using `useThree` and a ref to `OrbitControls`. When bounds change, apply the fitted camera position, update the camera projection matrix, set the controls target to the fitted bounds center, and call `controls.update()`.

Render this component alongside `OrbitControls`, and pass the bounds callback from `HeroCanvas` into `HeroModel`.

- [ ] **Step 4: Update the test doubles and render test**

Extend the existing `@react-three/fiber` mock with a camera object and extend the Drei `OrbitControls` mock to accept a ref without changing its test id. Verify the existing render tests still pass and add a test that a selected model remains rendered when camera fitting is active.

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- tests/scene.test.tsx`

Expected: PASS, including camera-fit helper, existing camera defaults, scale, render, and empty-state tests.

### Task 3: Run repository verification

**Files:**
- Verify: `src/scene/HeroCanvas.tsx`
- Verify: `src/scene/HeroModel.tsx`
- Verify: `tests/scene.test.tsx`

- [ ] **Step 1: Run type-checking**

Run: `npx tsc -b --pretty false`

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Build the application**

Run: `npm run build`

Expected: PASS and Vite produces the production build.

- [ ] **Step 4: Run Playwright MCP user-perspective verification**

Open `http://127.0.0.1:4173/`, click the unique `Haro Green` roster button, and verify:

- the hero canvas is visible;
- the Haro Green model is fully visible with space around it;
- no browser console errors are reported.

- [ ] **Step 5: Review the working-tree diff**

Run: `git diff HEAD -- src/scene/HeroCanvas.tsx src/scene/HeroModel.tsx tests/scene.test.tsx`

Expected: only the camera-fit behavior and its tests are changed; no commits are created automatically.
