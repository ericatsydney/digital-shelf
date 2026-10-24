# Replace Haro Green with a textured Light Guncannon — Design

## Goal
Remove the Haro Green model and show a textured Light Guncannon (RG-style red figure) generated from four photos.

## Reuse check
Tripo (already integrated via `tripo-cli`) generates textured GLBs; `generator.ts` already has a `texture` option that the CLI never enables. No new library or service is needed.

## Requirements
1. `npm run model:generate` accepts `--texture` (boolean, default off). When set, the Tripo call no longer receives `texture=false` / `pbr=false`.
2. The textured GLB must still pass Meshopt compression and the 25 MiB limit. If it exceeds the limit, textures are downscaled/re-encoded to WebP in `compress.ts` (only if needed, decided after the first real result).
3. Generate "Light Guncannon" from the four photos (front, left, back, right order; JPGs converted from the HEICs), with `--texture`.
4. Height: the head is 18 m, excluding the shoulder cannon. `heightMeters` is whole-model height, so it is set to 18 x (total height / head height). Estimate from the front photo: 1380/1205 = 1.145, so about 20.6. Re-measure the generated GLB (bounding box vs head top) and adjust.
5. Remove Haro Green completely: `public/models/haro-green.glb`, its `public/collection.json` entry, and references in `README.md`, `AGENTS.md` and `tests/app.smoke.spec.ts`. Unit-test fixtures that mimic the real collection (`app`, `scene`, `collection`, `tacticalState` tests) use `light-guncannon`. Synthetic generator-test inputs ("Haro Blue") are unrelated example strings and stay.
6. Orientation: set `display.rotationYDegrees` only if the generated model does not face the camera.

## Exclusions
No scene/UI changes, no new stages, no Tripo REST rewrite, no commits.

## Failure behaviour
Existing behaviour is kept: the CLI stops before spending credits on a duplicate id or missing key; if compression or size fails the raw GLB is kept in a temp folder and its path is printed. If the generated model is unusable, Haro is not removed until a good replacement is installed.

## Acceptance criteria
- `npx tsc -b`, `npm run test`, `npm run build`, `npx playwright test` pass.
- The secret check in AGENTS.md prints nothing.
- Browser: clicking the Light Guncannon button renders the textured model in the 3D canvas with no console errors.
- `grep -ri haro` finds nothing in `public/`, `src/`, `README.md`, `AGENTS.md`, smoke tests.

## Tests
- `tests/modelGenerator/generator.test.ts` (or existing generator tests): `texture: true` omits the `-p texture=false` args; default keeps them.
- `tests/modelGenerator/cli.test.ts`: `--texture` is passed to `createGenerator`; omitted by default.
- Existing tests updated for the renamed fixtures.
