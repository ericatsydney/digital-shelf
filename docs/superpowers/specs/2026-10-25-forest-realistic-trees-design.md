# Forest realistic trees and tuned sway - design

Follow-up to `2026-10-25-forest-tree-wind-design.md`. Approach chosen by the user: clustered leaf blobs (procedural, no assets).

## Problem
The first sway slid a rigid sphere canopy sideways with one shared rhythm. Trees looked like floating blobs.

## Requirements
- `src/scene/treeGeometry.ts`: `buildTreeGeometry(tree)` returns one merged, flat-shaded geometry per tree in tree space (y = 0 at the base): flared tapered trunk, 2-3 branches, and a canopy of 7-9 overlapping icosahedron leaf clusters with per-cluster colour variation (lighter on top). Trees whose canopy is `round` and whose seeded hash divides by 3 are pines (stacked cones). Deterministic per tree. Vertex attributes: `position`, `normal`, `color`, `aLeaf` (0 trunk/branch, 1 leaves), `aPhase` (per-cluster random phase).
- `ForestBackdrop.tsx`: one mesh per tree using the merged geometry with `vertexColors`.
- `windMaterial.ts` shader: bend weight `swayWeight(y / treeHeight)`; a gust wave travelling along the wind direction (phase from world position), a small lean plus a gentle oscillation about it; leaf flutter scaled by `aLeaf` with per-cluster `aPhase`; strength lower for horizon trees; reduced-motion disables it.

## Failure behaviour
Shader marker missing -> trees render static (unchanged).

## Acceptance criteria
- Trees look like clustered, branched trees with colour variation; no flat-sphere canopies.
- Trunk base fixed; canopy bends as a whole with leaf flutter; neighbours sway out of phase as a travelling gust.
- Other stages unchanged; no console errors; tsc, vitest, build, Playwright pass.

## Tests
Unit: geometry determinism, attributes, bounds, leaf/non-leaf vertices, pine vs broadleaf; wind helper still injects uniforms/attributes and tolerates a missing marker. Existing tests stay green.
