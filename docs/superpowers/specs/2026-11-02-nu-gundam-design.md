# Nu Gundam model — Design

## Goal
Add a textured Nu Gundam (RX-93) to the shelf, generated from four photos, following the Light Guncannon pattern.

## Reuse check
`npm run model:generate` (Tripo, `--texture`) already exists; no new tooling.

## Requirements
1. Source: HEIC photos in `J:\My Drive\digital-shelf\nu-gundam`, converted to JPG (front `IMG_3021`, left `3022`, back `3024`, right `3025`), kept in `assets/source-images/nu-gundam-*.jpg`.
2. Generate with `--title "Nu Gundam" --category Figure --tags gunpla,mobile-suit --height 22 --texture`; output `public/models/nu-gundam.glb` and a `public/collection.json` entry.
3. `display.rotationYDegrees: 90` so it faces the camera; `scale` and `heightMeters` 22 (canonical height, not measured against the photos).
4. Smoke test updated: roster shows `3 units`, Nu Gundam is selectable; heavy mobile dropdown test gets a 120 s timeout like other 3D tests.

## Exclusions
No scene/UI changes, no commits.

## Failure behaviour
Existing CLI behaviour (stops on duplicate id or missing key; keeps raw GLB on compression failure).

## Acceptance criteria
tsc, vitest, build and Playwright pass; secret check prints nothing; clicking Nu Gundam renders the textured model facing the camera with no console errors.

## Tests
`tests/app.smoke.spec.ts`: unit count and Nu Gundam selection.
