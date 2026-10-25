# Forest tree wind sway - plan

1. Write `tests/windMaterial.test.ts` (failing): swayWeight bounds/monotonic, applyWind injection, missing-marker tolerance. Run `npx vitest run tests/windMaterial.test.ts` -> fails (module missing).
2. Implement `src/scene/windMaterial.ts`. Re-run test -> passes.
3. Wire into `src/scene/ForestBackdrop.tsx` (trunk, canopy, strength by layer). Run `npm run test` -> all pass.
4. Verify: `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`.
5. Playwright MCP on Vite (port 4173): Forest stage, Light Guncannon, two screenshots a moment apart, console errors.
6. Secret check commands from AGENTS.md, code review of `git diff HEAD`. No commits.
