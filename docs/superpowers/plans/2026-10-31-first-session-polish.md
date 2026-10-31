# First-Session Polish — Implementation Plan

Spec: `docs/superpowers/specs/2026-10-31-first-session-polish-design.md`. No commits. Files are CRLF in the working copy; preserve line endings and write UTF-8 explicitly (a prior cp1252 slip broke `…`).

## Verification commands
`npx tsc -b --pretty false` · `npm run test` · `npm run build` · `npx playwright test` (known pre-existing failure: "switches through every hologram stage"; run the rest with `--grep-invert` and report it) · secret check · Playwright/browser check at http://127.0.0.1:4173 · code-review on `git diff HEAD`.

## Tasks (sequential, TDD, review after each)
1. **Loading progress** (`src/scene/HeroCanvas.tsx`, `tests/loadingLabel.test.ts`): failing test for `formatLoadingLabel` (0 -> "Loading unit…", 42.4 -> "Loading unit… 42%", >100 clamps, NaN safe); implement + use `useProgress` in the fallback.
2. **Controls hint** (`src/components/ControlsHint.tsx`, `HeroCanvas.tsx`, `app.css`, `tests/controlsHint.test.tsx`): tests for text per mode, dismiss button, hidden unless visible; implement; dismiss on first `pointerdown` on the canvas wrapper; position clear of stage icons/dropdown at <=700px.
3. **Capture polish** (`src/scene/useCapture.ts`, `src/components/CaptureButton.tsx`, `HeroCanvas.tsx`, `app.css`, `tests/capture.test.ts`): tests for `composeCaptureCanvas` (height + strip, title drawn, no-context fallback) and filename pattern; implement; "Saved <filename>" status clearing after 3 s (fake timers test).
4. **Mobile guard + e2e** (`tests/app.smoke.spec.ts`): add 390x844 no-overflow/in-viewport test; assert hint and "Saved" status in the capture test.
5. **Full verification + review**: all commands above, browser check at desktop and 375px with screenshots, secret check, code-review, fix Critical/Important.

## Loop
`/loop` self-paced over tasks 1-5; stop on completion with no Critical/Important findings, or on a failure two attempts cannot fix.
