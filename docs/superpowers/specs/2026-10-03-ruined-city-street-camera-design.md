# Ruined City Street Camera Design

## Summary

When the user selects the existing Ruined City tactical stage, reset the hero camera to a street-facing composition aligned with the backdrop's roadway. Keep Haro fully visible through the existing bounds-based camera fit, and preserve OrbitControls after the automatic reset.

## Goals

- Point the Ruined City camera down the existing Z-axis street.
- Reset the camera whenever a stage-selection action occurs.
- Keep the selected model fully framed with breathing room.
- Preserve explicit per-unit camera settings when provided.
- Preserve orbit, pan, and zoom interactions after the reset.
- Preserve Hangar and Space camera behavior.

## Non-goals

- Do not change the Ruined City street geometry or backdrop dimensions.
- Do not add camera fields to stage JSON.
- Do not change model scale, model assets, roster UI, or stage visuals.
- Do not change loading or model-error behavior.

## Design

`HeroCanvas` will retain the generic `getCameraFit` helper. The default Ruined City camera profile will be replaced with a near-end-of-road position, moderate elevation, and a target near Haro's standing height so the camera direction follows the street's Z axis. The fit helper will continue to preserve that direction while adjusting distance to contain the loaded model.

The tactical reducer will add a `cameraResetId` counter. Every `select-stage` action increments it, including selecting the currently active stage. `App` passes the counter to `HeroCanvas`. The camera-fit effect includes the counter in its dependencies, so each stage-selection action reapplies the stage camera profile and refits the current model. Unit selection continues to trigger the existing model reload and fit behavior.

Explicit `unit.camera` settings remain higher priority than stage defaults. Hangar and Space continue using the existing default camera unless a unit explicitly overrides it.

## Data flow

1. The user clicks a tactical-stage button.
2. `tacticalReducer` updates `stageId` and increments `cameraResetId`.
3. `App` resolves the selected stage and passes the reset ID to `HeroCanvas`.
4. `HeroCanvas` resolves the explicit unit camera or stage fallback profile.
5. `HeroCameraFit` recomputes the fitted position from the model bounds, preserves the street-facing direction, targets the model bounds center, and updates OrbitControls.

## Failure behavior

- Empty or invalid model bounds continue to use the selected fallback camera unchanged.
- Model loading failures continue to show `Model unavailable`.
- Missing explicit unit cameras continue to use stage defaults.
- No stage data or backdrop loading behavior changes.

## Acceptance criteria

- Selecting Ruined City resets the camera to a street-facing view.
- The roadway visibly recedes through the scene around Haro.
- Haro is fully visible with breathing room after the reset.
- Selecting another stage restores that stage's camera behavior.
- Selecting a stage increments the camera reset revision.
- Explicit unit camera settings continue to take precedence.
- OrbitControls remain enabled after automatic camera resets.
- Type-check, unit tests, build, and Playwright verification pass without browser console errors.

## Test plan

- Add reducer coverage confirming stage selection increments `cameraResetId`.
- Update camera-default tests to assert the Ruined City profile is aligned with the street direction and preserves explicit unit cameras.
- Retain existing camera-fit helper, rendering, and fallback tests.
- Run `npx tsc -b --pretty false`, `npm run test`, `npm run build`, and `npx playwright test`.
- Use Playwright to select Haro Green, click Ruined City, confirm the visible 3D canvas, and check browser console errors.
