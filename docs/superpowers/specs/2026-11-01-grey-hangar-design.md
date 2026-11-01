# Grey Hangar theme — design

**Date:** 2026-11-01 · **Status:** requested by the user with a reference photo (a grey diorama hangar: neutral mid-grey walls and floor, light panels, hazard-yellow markings). The look was checked on GPU screenshots.

## Goal

Turn the Hangar's colour theme from dark blue walls and a warm beige floor into a neutral industrial grey.

## Reuse check

No library is needed: the walls and floor are painted onto canvases by existing code, so this is a palette change.

## Scope

- `src/scene/hangarPalette.ts`: `greyRgb(level, alpha?)` returns a near-neutral grey (channels within 3 steps), plus the grey levels used by the wall, floor and flat fallback colours.
- `hangarWallTexture.ts`: panels, containers, pipes, trusses, catwalks, lamp glow and floor fade all use grey (lamps glow soft white instead of blue). Panels are mid-grey, not near-black.
- `hangarFloorTexture.ts`: grey steel plates, grey panel edges, grime and oil stains (rust streaks become dark-grey grime).
- `HangarBackdrop.tsx`: fallback wall colour, floor slab and ceiling beams use the greys.
- Colour grade: a new per-stage `tint` setting (0 = neutral, 1 = full cool-shadow / warm-highlight split). Hangar uses 0.2 so the grade does not turn the grey walls blue again; other stages stay at 1. Hangar exposure 1.05, vignette 0.7.
- Excluded: the turntable, accent beams and crates (the accent colour is still cyan), hazard-yellow floor markings, lighting changes, other stages.

## Failure behaviour

Unchanged: without a 2D canvas the flat grey fallback colours are used. On software WebGL the grade is skipped, so only the greyer textures show.

## Acceptance criteria

1. Walls and floor read as neutral grey in the Hangar, with no strong blue or beige cast.
2. The model, turntable, crates and accent beams look the same as before.
3. Other stages look the same as before.
4. All checks in AGENTS.md pass.

## Tests

`hangarPalette.test.ts` (neutral greys, clamping, walls grey and lighter floor, neutral flat colours); `cinematicSettings.test.ts` (Hangar tint low and positive, other stages 1); existing texture and backdrop tests updated for the new floor colour. Visual check: GPU screenshot of the Hangar.

## Round 2 (user feedback)

- Simpler wall: a few big riveted plates, pipes and trusses with fine grit and grime streaks; the window-like panel slots, catwalks, containers and lamp glows are gone.
- No bluish light on the walls: the cyan wall light strips are removed and the ceiling light strips are neutral white.
- Floor: many small stains (radius 5-26 px, was up to 88) plus fine scuffs and specks for realistic detail.

## Round 3 (user feedback)

- The black painted truss frame is replaced by a 3D steel skeleton of square grey bars on the side and back walls (`getHangarSkeleton`): a thick bottom bar (1.8), a medium middle bar (1.0) and thinner posts (0.8) under the ceiling beams. The girders and ceiling beams use a cool emissive so the warm Hangar lamps don't turn the grey steel tan.
- Floor: chamfered sci-fi plates with hairline seams (1.5 px), inset bevels, bolts and vent slots; stains narrowed (radius 3-13 px) and lightened (alpha up to 0.18).
- The crate stack moved to the rear-right corner of the bay.

## Round 4 (user feedback, with a reference crop)

- Wall repainted to match the reference: big flat olive-grey plates with shallow recessed fields, a few lighter pillars and a horizontal ledge; no grit, grime or rivets.
- Steel recoloured to the reference's light blue-grey (#8d999f girders, #7d898f ceiling beams).
- Bars are no longer square: the bottom bar is turned upright (1.4 deep, 2.4 tall); the middle bar is a wide flat corridor deck (4.2 deep, 0.7 thick); posts are thin flat slats.
- A fence (two slim rails and a post every ~5 m) runs along the outer edge of the deck on the left, back and right walls (`getHangarFence`).
- The ceiling beams now sit at the same z positions as the three vertical bars on each side wall (`HANGAR_POST_ZS`), so there are three beams instead of four.

## Round 5 (user feedback)

- The painted pillars and ledge are removed from the wall texture (the steel is 3D), leaving only big plates.
- Steel is now slightly darker than the floor plates (#606a70 girders, #5c666c ceiling beams), so it reads as steel against the lighter deck-plated floor.
- A big wall-mounted status screen hangs on the left wall between the second and third posts, facing the right wall, scrolling a green diagnostic log slowly upward (`HangarConsole`, `consoleLayout.ts`). A desk and computer were tried first and removed at the user's request. The log holds still with reduced motion.
