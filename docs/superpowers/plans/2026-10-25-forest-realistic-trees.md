# Forest realistic trees - plan

1. Failing tests: `tests/treeGeometry.test.ts`; update `tests/windMaterial.test.ts` for `{ treeHeight, strength }`. Run `npx vitest run tests/treeGeometry.test.ts tests/windMaterial.test.ts` -> fail.
2. Implement `src/scene/treeGeometry.ts` and the new shader in `src/scene/windMaterial.ts` -> pass.
3. Rewrite `Tree` in `src/scene/ForestBackdrop.tsx` to one merged mesh. `npm run test` -> pass.
4. `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`.
5. Playwright MCP on Vite 4173: Forest + Light Guncannon, screenshots, console errors.
6. Secret check from AGENTS.md; review `git diff HEAD`. No commits.
