# Ruined City ash mist — design

**Date:** 2026-11-01 · **Status:** approved by user. Four prototype variants (ground haze, falling ash with embers, light shafts, all three) were reviewed on screenshots. The user chose **ground haze plus falling ash and embers at one third of the prototype's particle count**. Light shafts were not chosen. After seeing the result, the user asked for a further cut to one third (ash and embers now one ninth of the prototype, haze one third of its opacity) and for slower, more varied movement.

## Goal

Make the Ruined City feel like it is still smouldering: a low warm dust haze drifting across the street, with sparse ash flakes falling and a few embers rising.

## Reuse check

- drei `Sparkles` / `Cloud` were considered. Sparkles has no fall direction or sideways sway, and Cloud builds volumetric puffs that read as weather rather than ground dust. Neither was chosen.
- Plain three.js `Points` and textured planes cover the need with no new dependency, following the pattern of the existing space-drift particles in `StageBackdrop.tsx`.

## Scope

- `src/scene/ashMist.ts` (pure, unit-tested):
  - `getAshMistSettings({ narrow })` returns particle counts and haze settings. Desktop: 156 ash flakes and 16 embers (one ninth of the prototype's 1400 and 140). Haze opacity 0.047 (one third of 0.14). Phones (narrow screens): half the particles.
  - `getHazeLayers()` returns 14 deterministic layers (z, x, width, drift speed).
  - `seedParticles(count, seed)` returns positions and speeds inside the street volume.
  - `stepParticles(...)` advances particles: ash falls slowly (about 40% of the prototype speed) and embers rise slowly. Both swirl sideways and in depth with a per-particle phase, on wind that gusts over time (`windGust`), and wrap inside the volume. With reduced motion (`motion = 0`) the step does nothing.
- `src/scene/RuinedCityAtmosphere.tsx`: `GroundHaze` (14 vertical noise-textured planes, colour #d9b08c, opacity from settings, slow texture drift that follows the same gusts) and `AshParticles` (ash flakes #d8d2cc, size 0.27; additive embers #ff8a3d, size 0.3; half the prototype sizes, at the user's request).
- `HeroCanvas` renders `<RuinedCityAtmosphere>` on the Ruined City stage once the renderer is known to be GPU-backed. The throwaway `AshMistPrototype.tsx` and its `?ash=` wiring are removed.
- Excluded:
  - light shafts;
  - changes to other stages;
  - a user toggle;
  - new dependencies.

## Failure behaviour

- **Software renderer** (SwiftShader, llvmpipe and similar): the atmosphere is skipped, the same rule the colour grade uses. Fourteen screen-covering transparent planes would stall CPU rendering, and the Playwright smoke tests run there.
- **Reduced motion:** the haze and particles are still drawn, but stay still.
- **Cleanup:** textures and geometry are disposed when the stage is left.

## Acceptance criteria

1. The Ruined City shows a faint warm ground haze and sparse, slowly swirling ash with a few rising embers, at the reduced amounts above.
2. Other stages are unchanged.
3. PNG capture includes the effect.
4. No console errors, and all checks in AGENTS.md pass.

## Tests

- **Unit tests:**
  - counts (desktop is one ninth of the prototype; phone is lower) and haze opacity;
  - 14 haze layers that are deterministic;
  - seeded particles start inside the volume;
  - stepping moves ash down slowly and embers up, moves particles in depth, varies over time, and wraps them at the volume edges;
  - `motion = 0` freezes particles.
- **Gate test:** `shouldShowAshMist(stage, softwareRendering)` is true only for the Ruined City on a confirmed GPU renderer. It is tested as a pure helper, because the scene tests' mocked canvas never reports a renderer.
- **Visual check:** GPU-enabled capture of the Ruined City.
