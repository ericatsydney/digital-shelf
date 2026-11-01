# Cinematic colour grade — implementation plan

Spec: `docs/superpowers/specs/2026-11-01-cinematic-look-design.md`

1. **Settings (TDD).** Write `tests/cinematicSettings.test.ts` for `getCinematicSettings` and `isSoftwareRenderer`; run `npx vitest run tests/cinematicSettings.test.ts` → fails (module missing). Implement `src/scene/cinematicSettings.ts` → passes.
2. **Component.** Create `src/scene/CinematicLook.tsx` (composer: render → output → grade). Wire into `src/scene/HeroCanvas.tsx` behind the software-renderer check; mock it in `tests/scene.test.tsx`. `npm run test` → all pass.
3. **Tune.** Screenshot Hangar, Forest, Ruined City via the dev server on 4173 with GPU-enabled Chromium; adjust vignette/exposure per stage.
4. **Verify.** `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` (excluding the known pre-existing crashing "switches through every hologram stage" test), secret check.
5. **Review.** Review `git diff HEAD` + untracked files; fix Critical/Important.
6. **Hand over.** Send final stage captures. No commit.
