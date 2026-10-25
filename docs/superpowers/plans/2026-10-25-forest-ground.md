# Forest ground - plan

1. Failing test `tests/forestGroundTexture.test.ts`; `npx vitest run tests/forestGroundTexture.test.ts` -> fails.
2. Implement `src/scene/forestGroundTexture.ts` -> passes.
3. Delete grass files and tests, drop `applyGrassWind`; wire the texture into `ForestBackdrop.tsx`. `npm run test` -> passes.
4. `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`.
5. Browser check on Vite 4173 (fresh tab), console errors; secret check; manual diff review. No commits.
