# Forest stage: bright painted-sky look (Obsolete reference) — Design

## Goal
Restyle the Forest stage after the reference frame (Obsolete S01E02): low-angle, bright daylight, a large painterly streaky-cumulus teal/blue sky, round-canopy trees on the horizon, the model rising against the sky.

## Reuse check
`three` and `@react-three/drei` are already dependencies. drei `Sky`/`Clouds` give a soft photoreal look, not the hand-painted anime clouds, so the sky is a small procedural canvas texture on a back-faced dome. No new dependency, no image asset.

## Requirements
1. **Sky dome:** a large inside-facing sphere textured with a canvas-generated gradient (deep teal/blue at the top, paler near the horizon) with streaky cloud bands. Pure function `createSkyTexture`-style helper split into a testable `getSkyPalette()`/layout data part and a thin canvas part (canvas is unavailable in jsdom, so rendering is guarded).
2. **Trees:** replace cone pines with round and flat-topped canopy trees (trunk + squashed sphere foliage in brighter greens). `getForestLayout()` stays deterministic, layered (3 layers), outside the model clearing (`|x| - radius >= 12`) and reaching z < -45.
3. **Ground/horizon:** brighter savanna green floor and path; distant tree line at the horizon.
4. **Light and colour:** `stages.json` Forest entry gets a bright sky background, higher ambient and directional intensities; fog colour follows `stage.background`, fog distances kept (65 to 150) unless the horizon looks washed out.
5. **Camera:** lower Forest camera (`forestCamera` in `HeroCanvas.tsx`), e.g. position `[-8, 2, 34]`, target `[0, 8, 0]`, tuned in the browser so the model rises against the sky. Per-unit `camera` overrides still win.

## Exclusions
Hangar, Ruined City, the model, UI, animated clouds, post-processing.

## Failure behaviour
If canvas 2D is unavailable the sky falls back to the flat `stage.background` colour; the stage still renders. No new network requests.

## Acceptance criteria
- `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` pass; secret check prints nothing.
- Browser: Forest stage with Light Guncannon shows a bright cloudy sky, round-canopy horizon trees and a low-angle view; no console errors.
- Other stages look unchanged.

## Tests
- `tests/environmentLayout.test.ts`: forest layout still deterministic/layered/outside clearing; trees carry canopy shape data.
- `tests/scene.test.tsx`: new Forest camera defaults; fog follows the stage background colour; the sky dome renders for Forest only and the canvas-less fallback does not throw.
- `tests/stages.test.ts`: updated Forest stage values.
