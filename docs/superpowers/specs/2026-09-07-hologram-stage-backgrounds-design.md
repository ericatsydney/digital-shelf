# Hologram Stage Backgrounds Design

Date: 2026-09-07
Status: Approved design; awaiting written-spec review

## Purpose

Upgrade the tactical stage presets so Hangar, Space, and Ruined City change the full presentation atmosphere rather than only changing the grid color. The implementation must use CSS and JavaScript/Three.js only, with no new image assets, external requests, or runtime dependencies.

## Scope

### In scope

- Add stage-specific hologram atmosphere settings to the existing local stage records.
- Add a reusable procedural backdrop within the existing hero scene.
- Use CSS layers for broad gradients, glow, scanlines, stars, and skyline styling.
- Use lightweight Three.js procedural elements where depth improves the presentation.
- Preserve the existing model, orbit controls, stage controls, capture action, static hosting, and mobile layout.
- Respect `prefers-reduced-motion` by disabling or reducing animation.

### Out of scope

- New raster/vector/image texture files.
- External assets, APIs, fonts, or runtime services.
- New 3D model files.
- Gameplay, movement, or deployment-slot behavior.
- Reworking the existing collection or capture architecture.

## User experience

Selecting a stage updates the entire hero presentation:

- **Hangar:** cyan industrial hologram bay with focused glow, bay markers, and scanline treatment.
- **Space:** deep violet-black atmosphere with sparse stars, cool bloom-like glow, and subtle floating particles.
- **Ruined City:** warm orange emergency haze with holographic skyline silhouettes, scanlines, and restrained structural depth.

The current GLB model remains mounted while the backdrop changes. The grid remains present but becomes one layer of the larger stage treatment.

## Architecture

The existing `StageRecord` remains the source of truth for stage selection. It will gain a typed visual configuration, for example a backdrop variant, accent colors, animation intensity, and optional procedural counts. `App` continues to resolve the selected stage and passes it through `HeroCanvas`.

`HeroCanvas` mounts a `StageBackdrop` component alongside `StageScene` and `HeroModel`. `StageBackdrop` owns only stage-specific decorative geometry and animation state; it must not own model loading, camera controls, or capture behavior.

CSS selectors driven by a stage variant or data attribute provide the broad atmosphere around the canvas. Decorative DOM layers must not be relied upon for PNG capture; the canvas scene must contain the visual content required for the captured presentation.

## Data flow

```text
public/stages.json
  -> loadStages and StageRecord validation
  -> App resolves selectedStage
  -> HeroCanvas receives selectedStage
  -> StageBackdrop renders selected procedural treatment
  -> StageScene applies background, grid, and lighting values
```

Stage changes must not increment the model `requestId`, remount the GLB, or reset orbit controls.

## Failure behavior

- Missing or invalid visual settings fall back to the existing Hangar-compatible background, grid, lighting, and a static minimal backdrop.
- A decorative procedural effect must fail closed without preventing the model or command sheet from rendering.
- `prefers-reduced-motion: reduce` disables continuous particle/scanline animation while retaining static stage identity.
- No new network requests are introduced.

## Candidate implementation files

- `public/stages.json`
- `src/app/types.ts`
- `src/data/stages.ts`
- `src/scene/StageBackdrop.tsx` (new)
- `src/scene/HeroCanvas.tsx`
- `src/app/app.css`
- `tests/app.smoke.spec.ts`
- `tests/stages.test.ts` if stage validation needs focused coverage

## Acceptance criteria

1. Hangar, Space, and Ruined City have visibly distinct hologram atmospheres beyond grid-color changes.
2. Changing stages preserves the active model and orbit controls.
3. PNG capture remains available and succeeds after stage changes.
4. The implementation adds no image assets, external requests, or dependencies.
5. Reduced-motion mode removes continuous animation without removing stage identity.
6. Desktop and narrow mobile layouts remain usable.
7. Existing and new tests pass, including TypeScript, unit tests, production build, and Playwright smoke tests.

## Test plan

- Extend stage validation tests for the new optional visual settings and fallback behavior.
- Extend Playwright coverage to select each stage and assert the stage-specific visual marker/class or canvas state changes.
- Confirm the active model remains visible after switching stages.
- Confirm capture remains enabled after switching stages.
- Run the repository-required verification commands before code review.

