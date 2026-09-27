# Fit 3D Model to Canvas Design

## Requirements

- Keep the existing authored and height-aware model scaling behavior unchanged.
- After a model loads, calculate its effective bounds and fit the perspective camera so the full model is visible in the hero canvas.
- Aim the camera and orbit controls at the model bounds center rather than always targeting the world origin.
- Refit when the selected model changes or the loaded model bounds change.
- Preserve explicit per-record camera settings as the starting framing, while correcting the distance enough to avoid clipping the model.
- Keep zoom, rotate, and pan interactions available.
- Preserve the existing loading and model-error states.

## Scope

Modify the hero scene camera/model coordination and its unit tests. Do not change model assets, stage visuals, controls, or unrelated layout behavior.

## Approach

`HeroModel` will report its effective post-scale bounding box to `HeroCanvas` after the GLB is available. A small camera-fit helper will calculate the bounds center and a safe perspective-camera distance from the bounding sphere radius, field of view, and a safety margin. A camera-fit child component will use React Three Fiber's camera and update the camera plus `OrbitControls` target when bounds change.

The camera will use the existing record/stage position direction as the preferred viewing direction. The fit calculation changes only the distance needed to contain the model, so the current stage-specific composition remains recognizable while oversized models no longer fill or exceed the canvas.

## Failure behavior

- Invalid or empty bounds leave the existing camera defaults unchanged.
- If camera fitting fails, the model remains rendered with the existing camera and no new error state is shown.
- Existing GLB loading failures continue to use `Model unavailable`.

## Acceptance criteria

- Haro Green is fully visible in the hero canvas after selection.
- The model has breathing room around its bounds and is not clipped at the canvas edges.
- OrbitControls still targets the model and zoom remains usable.
- Existing scene tests pass, including authored scaling and explicit camera defaults.
- Playwright MCP confirms the Haro Green flow renders a visible model canvas with no browser console errors.

## Tests

- Unit-test the camera-fit distance/target helper with valid bounds and invalid bounds.
- Unit-test that `HeroModel`/`HeroCanvas` retain the existing render contract.
- Run TypeScript, Vitest, production build, and Playwright MCP user-perspective verification.
