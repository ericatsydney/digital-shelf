# Ruined City floors and fires - plan

1. Update `tests/stages.test.ts` (rows <= 5, height formula, new height range) and add `tests/cityFire.test.ts`. `npx vitest run tests/stages.test.ts tests/cityFire.test.ts` -> fails.
2. Implement the floor cap in `src/scene/RuinedCityBackdrop.tsx`; implement `src/scene/cityFire.ts` -> pass.
3. Build `src/scene/Fire.tsx`, render three fires from `StreetCanyonBackdrop`. `npm run test` -> pass.
4. `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`.
5. Browser check on Vite 4173 (fresh tab): Ruined City stage, fires, light flicker, console errors, camera angles.
6. Secret check from AGENTS.md; manual diff review. No commits.

## Amendment: one live fire + static glow spots
7. Update `tests/cityFire.test.ts` (one live, two glow, ember-glow PNG size) -> fails.
8. `kind` in `src/scene/cityFire.ts`; `tools/ember-glow/generate.ts` + `npm run glow:generate`; `src/scene/emberGlowTexture.ts`; `src/scene/EmberGlow.tsx`; render glows in `RuinedCityBackdrop.tsx` -> passes.
9. Full verification, secret check, browser check as in steps 4-6.
