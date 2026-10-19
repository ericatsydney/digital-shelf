# Tripo Multi-Image Model Generator Implementation Plan

Spec: `docs/superpowers/specs/2026-10-19-tripo-model-generator-design.md`. Do not commit. Disjoint write scopes per task; review each task before the next.

## Task 1 - Verify CLI and scaffold
- Install/inspect `tripo-cli`: `tripo docs --topic commands/make`, `tripo --help`. Record in `tools/model-generator/README-notes` comment: multi-image limit/order, `--json` output shape, `-o` semantics (file vs directory). If it cannot give clean exit codes/JSON, stop and report (fallback: REST).
- Confirm the CLI flag/param for geometry-only (no texture) output and that the result is still a valid GLB the app renders.
- Check credit cost of one `tripo make` run for the user's H-series plan (balance command / docs) and note it; do not run a paid conversion yet.
- `npm i -D tsx`; add script `"model:generate": "tsx tools/model-generator/cli.ts"`; add `tools` to `tsconfig.json` include.
- Add `.env*` and `!.env.example` to `.gitignore`; create `.env.example` (`TRIPO_API_KEY=`).
- Verify: `npx tsc -b --pretty false`.

## Task 2 - config.ts (TDD)
Files: `tools/model-generator/config.ts`, `tests/modelGenerator/config.test.ts`. Tests first: env beats `.env.local`; missing key error without leaking value; name not `VITE_`-prefixed. Run `npx vitest run tests/modelGenerator/config.test.ts` (fail, then pass).

## Task 3 - collection.ts (TDD)
Files: `tools/model-generator/collection.ts`, `tests/modelGenerator/collection.test.ts`. Tests: slugify; defaults; record passes `validateCollectionRecord`; duplicate rejected, `force` overwrites; atomic write leaves file intact on failure.

## Task 4 - generator.ts (TDD)
Files: `tools/model-generator/generator.ts`, `tests/modelGenerator/generator.test.ts`. Tests with fake `execFile`: args for `{texture:false}` are exactly `make <img...> --json -o <out>` plus the geometry-only param confirmed in Task 1 (no `--for/--then`/face budget), run with no shell; `{texture:true}` changes only that one argument; success; each exit code 2-9 maps to a typed error; ENOENT -> install message; timeout kills child; invalid JSON; key passed via env only and redacted from errors.

## Task 5 - cli.ts (TDD)
Files: `tools/model-generator/cli.ts`, `tests/modelGenerator/cli.test.ts`. Tests: multiple positional images, flag parsing, image validation, orchestration order (collection written last), cleanup on failure, exit codes, `--force`.

## Task 6 - Docs
README section: `npm install -g tripo-cli`, `.env.local` setup, command and flags, multi-image usage, never commit keys.

## Verification (all must pass)
```powershell
npx tsc -b --pretty false
npm run test
npm run build
npx playwright test
git ls-files | Select-String -Pattern '(^|/)\.env' | Where-Object { $_ -notmatch '\.env\.example$' }
git diff HEAD | Select-String -Pattern 'TRIPO_API_KEY\s*=\s*\S|tsk_[A-Za-z0-9]{8,}'
```
Expected: first four pass; last two print nothing. Manual (user puts key in `.env.local`): `npm run model:generate -- front.png back.png --title "Test" --height 18`, then `npx vite --port 4173`, select the model, confirm the canvas renders it with no console errors (Playwright MCP, capture screenshot).

## Review
Run code-review on `git diff HEAD` + `git status --short`; fix Critical/Important findings.
