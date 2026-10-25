# Forest ground colour and tree shade - design

Supersedes `2026-10-25-forest-grass-design.md` (grass removed at the user's request).

## Requirements
- Remove the grass: `GrassField.tsx`, `grassLayout.ts`, `applyGrassWind`, their tests. Tree wind stays.
- `src/scene/forestGroundTexture.ts`: `getForestGroundLayout(trees, width, height)` (deterministic) and a cached canvas texture, same pattern as `hangarFloorTexture.ts`; `null` without a 2D context so the ground keeps a flat colour.
- Ground colour: muted base green with large soft patches (moss, dry olive, bare earth, leaf litter), fine speckle grain, and brown leaf-litter/dirt rings around each tree base.
- Tree shade: each tree casts a soft baked shadow (canopy ellipse plus trunk streak) displaced away from the scene's main directional light (position [4, 8, 5]), so shade falls toward -x/-z. World-to-canvas: x in [-80, 80], z in [-100, 80].
- `ForestBackdrop.tsx`: the 160 x 180 ground slab top becomes a textured plane at `floorY` (slab kept for thickness), roughness 1, no path or circle.

## Failure behaviour
No canvas context -> flat green `#5d8f3e` as before.

## Acceptance criteria
- No grass; ground looks varied and earthy; visible soft shade under and beside trees; other stages unchanged; no console errors; tsc, vitest, build, Playwright pass.

## Tests
Unit: layout determinism, patch/shadow bounds, one shadow per tree inside the ground, shadows displaced to -x/-z of their tree, null without a context. Existing tests stay green.
