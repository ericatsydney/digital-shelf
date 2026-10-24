# Hangar stage: turntable + painted static wall — Design

## Goal
Rework the Hangar stage after the reference render (Mech Hangar Sci-Fi): a dense industrial bay, with the robot standing on a round platform. Dragging on the Hangar stage rotates the platform (and robot) while the camera stays fixed. Because the camera is fixed, the wall detail is a static painted pattern instead of 3D geometry, to keep rendering cheap.

## Reuse check
- `@react-three/drei` `PresentationControls` (already installed) rotates a group on drag with the camera fixed; used instead of custom drag code.
- The procedural canvas-texture approach already used for the Forest sky and the Ruined City walls is reused for the wall pattern (no image assets).

## Requirements
1. **Controls mode:** pure helper `getHeroControlsMode(stage)` returns `'turntable'` for the Hangar and `'orbit'` otherwise. In turntable mode the model and platform sit in a `PresentationControls` group (global drag, horizontal only: `polar={[0, 0]}`, unlimited azimuth, light inertia); `OrbitControls` keeps wheel zoom but has rotate and pan disabled. Forest, Ruined City and unknown/legacy stages keep today's orbit controls.
2. **Turntable:** a round platform (thick disc, glowing accent ring, hazard-stripe band, panel seams) centred under the model at the floor level, rotating together with the model. The model's `display.rotationYDegrees` still applies inside the group.
3. **Static wall pattern:** `src/scene/hangarWallTexture.ts` paints, deterministically, a dark steel wall: panel grid and rivets, diagonal scaffolding lattice, pipes and cable lines, catwalk silhouettes with railings (no yellow gantry or weapon rack), stacked cargo containers near the floor, cool blue lamp glows. Applied to the back wall plane and the two side wall planes of the existing bay layout; texture is cached; without a canvas context the walls fall back to their flat colour.
4. **Floor:** keep the existing floor size, add a painted panel-seam texture or seam lines; keep the yellow floor markings.
5. **Remove heavy 3D wall detail:** side columns, wall boxes and catwalk boxes that the pattern now replaces. Keep ceiling beams with their light strips, crates and the lights.
6. **Light:** darker industrial `stages.json` values with a cool tint.

## Exclusions
Forest and Ruined City stages, the model, UI, animated steam, yellow gantry/weapon rack, camera defaults for other stages.

## Failure behaviour
No canvas: flat-colour walls. Pointer events outside the canvas never rotate the platform. Reduced motion needs no handling because nothing auto-animates; inertia only follows a user drag.

## Acceptance criteria
- `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` pass; secret check prints nothing.
- Browser, Hangar + Light Guncannon: the painted industrial wall is visible, the model stands on a round platform, a horizontal drag rotates platform and model while the backdrop and camera do not move; wheel zoom still works; no console errors.
- Forest and Ruined City still orbit the camera on drag.
- The stage-cycling Playwright test is not slower than before this change.

## Tests
- `tests/scene.test.tsx`: `getHeroControlsMode` per stage variant; the Hangar scene contains the turntable and the platform-spin group.
- `tests/hangarWallTexture.test.ts`: deterministic layout data; null without a 2D context.
- `tests/backdropMaterials.test.tsx`: Hangar surfaces stay rough/non-metal except luminous lights; removed wall boxes no longer present; floor markings and light strips unchanged.
