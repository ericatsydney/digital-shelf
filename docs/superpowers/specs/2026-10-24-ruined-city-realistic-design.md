# Ruined City stage: realistic, damaged European street (Cucuruz Doan's Island reference) — Design

## Goal
Restyle the Ruined City stage after the reference frame (Mobile Suit Gundam: The Origin, Cucuruz Doan's Island): weathered European stone buildings with balconies, arched windows and pitched roofs, damaged by shelling, grey smoke columns, blue daylight sky, low camera angle.

## Reuse check
No new dependency. Reuse the existing street layout API (`getRuinedCityBuildings`, `getRuinedCityStreetDimensions`) and the procedural `SkyDome` built for the Forest stage (extended with a parameterised palette). Tripo-generated buildings were considered and rejected (credits, large files); procedural parts were chosen by the user.

## Requirements
1. **Module split:** move the street-canyon code from `StageBackdrop.tsx` into `src/scene/RuinedCityBackdrop.tsx`; `StageBackdrop.tsx` keeps re-exporting `getRuinedCityBuildings` and `getRuinedCityStreetDimensions` so existing imports keep working.
2. **Building spec:** `Building` gains deterministic damage data: `roof: 'pitched' | 'flat' | 'broken'`, `balconies`, `windowRows`, `damage` (missing corner/top chunk, shell holes, exposed slab), stone colour in warm beige/grey. Eight buildings, four per side, varied heights, within the current proportion limits (width 10–18, height 18–32, depth 12–24).
3. **Facade parts:** road-facing facade with recessed arched windows (dark glass, no emissive strips), cornice, balconies with railings, pitched roof with chimney or broken roof edge, shell holes (dark discs/boxes), exposed floor slabs and rubble at damaged corners. Repeated parts use `instancedMesh` to bound draw calls.
4. **Street:** cracked grey asphalt, sandy sidewalks, rubble piles, debris and a few wrecked vehicles/crates. Remove the scan ring and deployment pad (and the neon lane markers); keep street dimensions unchanged.
5. **Sky and smoke:** daylight `SkyDome` palette for this stage (blue, pale at horizon), plus 5–7 static grey smoke columns (stacked soft sprites/billboards) rising behind buildings; no animation required.
6. **Light and haze:** `stages.json` Ruined City entry gets a daylight background, warmer/stronger light; fog colour follows the background, mild distances.
7. **Camera:** lower ruined-city camera in `HeroCanvas.tsx` so the model rises against the sky between the buildings (tuned in the browser; unit camera overrides still win).

## Exclusions
Hangar and Forest stages, the model, UI, animation, Tripo-generated assets.

## Failure behaviour
Canvas-less environments fall back to a flat sky colour (existing `SkyDome` behaviour); the layout functions stay pure and deterministic; reduced-motion users get no motion because nothing animates.

## Acceptance criteria
- `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` pass; secret check prints nothing.
- Browser: Ruined City with Light Guncannon shows weathered damaged European buildings on both sides, smoke and a blue sky; no console errors; Hangar and Forest unchanged.
- The full Playwright stage-cycling test stays comfortably under its 60 s timeout (keep draw calls bounded).

## Tests
- `tests/stages.test.ts`: updated Ruined City values; building layout still balanced (4 + 4), varied heights, within proportion limits; new damage/roof fields deterministic.
- `tests/backdropMaterials.test.tsx`: rewrite the city cases for the new parts (all surfaces rough/non-metal; no emissive windows or scan rings remain).
- `tests/scene.test.tsx`: new ruined-city camera defaults; sky dome renders for Ruined City; fog follows the background.
