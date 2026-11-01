# Grey Hangar theme — implementation plan

Spec: `docs/superpowers/specs/2026-11-01-grey-hangar-design.md`

1. **Palette (TDD).** Write `tests/hangarPalette.test.ts`; run `npx vitest run tests/hangarPalette.test.ts` and see it fail; add `src/scene/hangarPalette.ts`.
2. **Textures.** Switch `hangarWallTexture.ts`, `hangarFloorTexture.ts` and `HangarBackdrop.tsx` to the palette; update the floor colour in `tests/backdropMaterials.test.tsx`.
3. **Grade tint (TDD).** Add the failing `tint` test to `tests/cinematicSettings.test.ts`; add `tint` to `cinematicSettings.ts` and the shader in `CinematicLook.tsx`.
4. **Verify.** `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test --grep-invert "switches through every hologram stage"`, and the secret check.
5. **Hand over.** Send before and after GPU screenshots of the Hangar. Do not commit.
