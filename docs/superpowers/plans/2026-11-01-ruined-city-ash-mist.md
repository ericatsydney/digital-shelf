# Ruined City ash mist — implementation plan

Spec: `docs/superpowers/specs/2026-11-01-ruined-city-ash-mist-design.md`

1. **Helpers (TDD).**
   - Write `tests/ashMist.test.ts` covering:
     - `getAshMistSettings`
     - `getHazeLayers`
     - `seedParticles`
     - `stepParticles`
   - Run `npx vitest run tests/ashMist.test.ts`. It should fail because the module is missing.
   - Implement `src/scene/ashMist.ts`. The test should then pass.
2. **Component.**
   - Create `src/scene/RuinedCityAtmosphere.tsx` (haze planes plus ash and ember points, disposed on unmount).
   - In `src/scene/HeroCanvas.tsx`, render it on the Ruined City stage when the renderer is GPU-backed.
   - Delete `src/scene/AshMistPrototype.tsx` and its wiring.
   - Cover the gate (Ruined City and GPU only) through `shouldShowAshMist` in `tests/ashMist.test.ts`.
   - Run `npm run test`. All tests should pass.
3. **Verify.**
   - Run `npx tsc -b --pretty false`, `npm run test`, `npm run build`, and `npx playwright test --grep-invert "switches through every hologram stage"`. The excluded test is a known pre-existing crash.
   - Run the secret check from AGENTS.md. It should print nothing.
4. **Review.** Review `git diff HEAD` plus untracked files, and fix any Critical or Important findings.
5. **Hand over.** Send a GPU-enabled Ruined City capture from the dev server on 4173. Do not commit.
