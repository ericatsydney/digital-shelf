# Replace Haro Green with textured Light Guncannon — Plan

Spec: `docs/superpowers/specs/2026-10-24-light-guncannon-replace-haro-design.md`
Verification (from AGENTS.md): `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`, secret check, Playwright MCP check on http://127.0.0.1:4173.

## Task 1 — `--texture` flag (TDD)
Files: `tools/model-generator/cli.ts`, `tools/model-generator/generator.ts` (only if needed), `tests/modelGenerator/cli.test.ts`, generator test file.
1. Write failing tests: CLI passes `texture: true` to `createGenerator` with `--texture`, false otherwise; generator omits `-p texture=false -p pbr=false` when textured. Run `npx vitest run tests/modelGenerator` — expect failures.
2. Add `texture` boolean option to `parseArgs`, extend `createGenerator(apiKey, { texture })`, update `main` wiring and `USAGE`.
3. Re-run tests — expect pass.
4. Update README generator section (document `--texture`, remove "texture generation is off").

## Task 2 — Generate the model (spends Tripo credits)
1. Confirm `.env`/`.env.local` has `TRIPO_API_KEY` (never print it).
2. Run from the repo root: `npm run model:generate -- <gc>/light-guncannon-front.jpg <gc>/light-guncannon-left.jpg <gc>/light-guncannon-back.jpg <gc>/light-guncannon-right.jpg --title "Light Guncannon" --height 20.6 --texture` where `<gc>` is the scratchpad folder `C:\Users\ericg\AppData\Local\Temp\gc`.
3. If it exceeds 25 MiB: add texture downscale/WebP step to `compress.ts` with a test, then re-run compression on the kept raw GLB.
4. Measure bounding box / head height of the GLB; adjust `heightMeters` (and `display.rotationYDegrees`) in `public/collection.json`.

## Task 3 — Remove Haro Green
1. Delete `public/models/haro-green.glb` and its `collection.json` entry.
2. Replace references in `README.md`, `AGENTS.md`, `tests/app.smoke.spec.ts`, and the fixtures in `tests/app.test.tsx`, `scene.test.tsx`, `collection.test.ts`, `tacticalState.test.ts`.
3. `grep -ri haro public src README.md AGENTS.md tests/*.spec.ts` — expect no output.

## Task 4 — Verify and review
1. Run the four verification commands; all must pass.
2. Secret check commands from AGENTS.md — expect no output.
3. Start Vite on 4173, use Playwright MCP: click Light Guncannon, confirm textured model renders, no console errors; capture screenshot.
4. Run code-review on `git diff HEAD`; fix Critical/Important findings.
5. Leave everything uncommitted.
