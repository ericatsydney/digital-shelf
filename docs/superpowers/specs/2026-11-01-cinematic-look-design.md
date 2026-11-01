# Cinematic colour grade for all stages — design

**Date:** 2026-11-01 · **Status:** approved by user. The first version (rim lights, reflections, contact shadows, bloom + grade) was reviewed on screenshots; the user rejected the rim lights, reflections, ground shadows and glow, so only the colour grade and vignette remain.

## Goal

Give every stage a film-style finish without changing its lighting: cool shadows, warm highlights, a little contrast, and a vignette.

## Reuse check

- three.js examples (already installed): `EffectComposer`, `RenderPass`, `OutputPass`, `ShaderPass`.
- `@react-three/postprocessing` was considered; not chosen because three's built-in passes cover the need with no new dependency.

## Scope

- `src/scene/cinematicSettings.ts`: pure `getCinematicSettings(stage)` returning per-stage `vignette` and `exposure`; `isSoftwareRenderer` / `getRendererName` for the fallback.
- `src/scene/CinematicLook.tsx`: composer (render → output → grade shader), built once per renderer; stage changes only update the vignette uniform and exposure.
- `HeroCanvas` renders `<CinematicLook>` once the renderer is known to be GPU-backed.
- Excluded: any change to scene lights, materials or geometry; rim lights, environment reflections, contact shadows, bloom and ambient occlusion (all prototyped and rejected); a per-user toggle; new dependencies.

## Failure behaviour

On CPU-only WebGL (renderer name matches SwiftShader, llvmpipe, softpipe or Microsoft Basic Render Driver) the grade is skipped and the plain image is shown, because a full-screen pass every frame stalls the page there. Playwright's default headless Chromium uses SwiftShader, so smoke tests exercise this fallback; the graded look is verified with GPU-enabled captures. Capture keeps working because the composer draws to the same canvas with `preserveDrawingBuffer`.

## Acceptance criteria

1. Every stage (Hangar, Forest, Ruined City) shows the grade and vignette, with its lighting unchanged.
2. PNG capture includes the grade.
3. No console errors; all checks in AGENTS.md pass; existing smoke tests pass.

## Tests

Unit: settings exist for every variant, and daylight stages get a lighter vignette than the Hangar; software renderer names are recognised. Existing scene tests mock `CinematicLook`. Visual check via screenshots of all three stages.
