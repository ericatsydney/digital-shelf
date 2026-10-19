# Tripo Multi-Image-to-3D Model Generator Design

## Goal
Offline command that converts one or more local images of the same object into a single GLB using the official Tripo CLI, stores it in `public/models/`, and appends a matching record to `public/collection.json`, so the web app renders it with no runtime change. Structured so a future local server can add web image upload and download by reusing the core module.

## Existing-solution check
- **Official Tripo CLI (`tripo-cli`, npm) - chosen.** Docs: https://developers.tripo3d.com/en/docs/cli.md. `tripo make front.png back.png` combines several images into one model; `-o/--out` sets output; global `--json` prints a final JSON line; `TRIPO_API_KEY` env var authenticates; documented exit codes (0 ok, 2 usage, 3 auth, 4 credits, 5 content policy, 6 task failed, 7 network, 8 not found, 9 rate limited).
- Raw REST API and community/VAST MCP servers - **not used**: they would duplicate upload/poll/download logic the CLI already provides; MCP tools are not callable from a web app and cost tokens per run.
- Image count limit and ordering are not documented on that page; plan Task 1 confirms via `tripo docs --topic commands/make` (or `tripo docs --llm`).

## MVP: geometry only, no texture (cost guard)
MVP output is an untextured, static, non-game-ready GLB. Texturing is a planned future addition, so the generator takes an options object `{ texture: false }` (MVP always false); a later `--texture` flag flips it without restructuring. Task 1 confirms how the CLI requests geometry-only (likely `--param texture=false`, since Tripo's API has a `texture` option) and records its credit cost for the user's H-series plan. The wrapper never passes `--for`, `--then`, or a face/low-poly budget (a budget <=20,000 switches the CLI to `tripo-p1`), and no rigging/post-processing steps. Tests assert the exact argument list for texture false (and that adding texture later only changes that one argument).

## Scope
In: `npm run model:generate -- <image> [<image>...] --title "..." [--id --category --description --tags a,b --height <m> --force]`; CLI wrapper; collection write; secret handling.
Out: texturing (future `--texture` flag), web upload UI, server, runtime app changes, text-to-3D, post-processing/texturing/rigging, thumbnails, auto-committing.

## Architecture
- `tools/model-generator/generator.ts` - `ModelGenerator` interface `generate(imagePaths: string[], outPath: string): Promise<void>` and `createTripoCliGenerator({ execFile, timeoutMs })`, which runs `tripo make <images...> --json -o <tmp>` via `execFile` (no shell), parses the JSON line, maps exit codes to typed errors. Swappable for a REST implementation later.
- `tools/model-generator/collection.ts` - `slugify`, `buildRecord`, `assertNoDuplicate`, `appendRecord`; validates with existing `validateCollectionRecord` from `src/data/collection.ts`.
- `tools/model-generator/config.ts` - loads `TRIPO_API_KEY` from process env, falling back to git-ignored `.env.local`, and passes it to the CLI child process env only.
- `tools/model-generator/cli.ts` - flag parsing and wiring only; a future server replaces this file.
- Run with `tsx` (new devDependency); `tsconfig.json` `include` gains `tools`. Prerequisite: `npm install -g tripo-cli` (Node 20+), documented in README; missing binary gives a clear install message.

## Data flow
1. Parse flags; read key; validate every image (png/jpg/webp, <=20 MB each, 1..N images, N from Task 1, no duplicates); derive id (slug of title unless `--id`); reject duplicate id/GLB unless `--force`.
2. `generate(images, tmpOut)` -> GLB in a temp directory.
3. Move to `public/models/<id>.glb` (temp + rename).
4. Write `collection.json` last (temp + rename); record: `id,title,category(default "Figure"),description?,tags?,model:"/models/<id>.glb",heightMeters?`.

## Failure behavior
Non-zero exit and one clear message, no partial output, existing models/`collection.json` untouched, for: missing key, CLI not installed, no/bad/oversized/too many images, bad flags, duplicate id without `--force`, each documented CLI exit code (auth, credits, content policy, task failed, network, rate limit), timeout (default 10 min, child killed), invalid record. Messages never contain the key.

## Secret handling
- Key only via `TRIPO_API_KEY` env var or `.env.local`; never `VITE_`-prefixed, never logged, never written to outputs; CLI stderr/stdout is redacted before display.
- `.gitignore` gains `.env*` and `!.env.example`; `.env.example` lists names only.
- AGENTS.md secret check (tracked `.env*` and diff pattern scan) must print nothing before handover.
- Future web upload keeps the key server-side only; deployments use the platform secret store.

## Acceptance criteria
1. With a fake CLI, N images yield one `<id>.glb` and a record that passes `validateCollectionRecord`.
2. Every failure above exits non-zero and leaves files unchanged.
3. Key never appears in output, errors, or files; `VITE_` name rejected by test.
4. Real run with 2+ images of one object yields a model selectable and rendered in the app (manual, costs credits).
5. `npx tsc -b`, `npm run test`, `npm run build`, `npx playwright test`, and the secret check all pass.

## Tests (Vitest)
Generator with injected fake `execFile` (success, each exit code, missing binary, timeout, bad JSON); argument construction (multiple images, no shell); collection logic; config; CLI parsing, image validation and exit codes; redaction.

## Implementation notes (verified in Task 1)
- `tripo make` takes 1 image (image-to-model) or 2-4 images (multiview, front required; filename hints or positional front,left,back,right order). Wrapper allows 1-4 images.
- Geometry-only: `-p texture=false -p pbr=false`. Wrapper also passes `--json --yes --quiet -o <tempdir>`; `-o` is a directory and the JSON result's `model_file` is checked to be a `.glb`.
- `tripo make ... --dry-run --json` works without a key and spends nothing.

## Addendum: automatic Meshopt compression
Cloudflare Pages/Workers Static Assets reject files above 25 MiB and a raw geometry-only Tripo GLB was 42.8 MB. After generation `tools/model-generator/compress.ts` (gltf-transform `meshopt`, level high; Meshopt chosen over Draco because drei's default Draco decoder loads from a CDN, whereas the Meshopt decoder is bundled) compresses the GLB (42.8 -> 7.8 MB). The CLI refuses to install a model still above 25 MiB, and when compression or the size check fails after credits were spent it keeps the raw GLB in its temp folder and prints the path.
