# Single Model MVP Implementation Plan

> Use bounded subagent-driven tasks, reviewed in sequence. Do not commit.

**Goal:** Remove deployment slot selection while preserving one model display and stages.

**Architecture:** Remove slot UI and reducer plumbing; retain existing single selectedUnitId model flow.

**Tech Stack:** React, TypeScript, Vitest, Playwright.

## Task 1: Remove deployment flow with TDD
Write scope: src/components/CommandSheet.tsx, src/app/App.tsx, src/app/app.css, src/state/tacticalState.ts, tests/app.test.tsx, tests/tacticalState.test.ts, tests/app.smoke.spec.ts, README.md.

- [x] Change initial reducer expectation to omit selectedSlotId; replace slot tests with model replacement assertions. Add component expectations `expect(screen.queryByRole('button', { name: /Deployment slot/i })).not.toBeInTheDocument()` and `expect(screen.queryByText('DEPLOYMENT')).not.toBeInTheDocument()` before/after selection.
- [x] Run `npm run test -- tests/app.test.tsx tests/tacticalState.test.ts`; expect failures because deployment controls and state remain.
- [x] Remove Deployment block, deploymentSlots, selectedSlotId/onSelectSlot props and wiring; remove selectedSlotId/select-slot reducer fields and branches. Change empty wording to `Select a unit from the roster to view it.` Remove slot CSS selectors and mobile two-column controls rule so stages fill available width.
- [x] Update smoke tests to assert absent deployment heading/buttons on desktop/mobile; retain model, stage and capture coverage. Add component coverage selecting a second fixture model and keeping the active stage.
- [x] Update README MVP and test descriptions to omit fixed-slot deployment.
- [x] Run focused tests; expect pass. Review task diff against spec.

## Task 2: Verification and review
- [x] Run `npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test`; all must exit 0 before code review.
- [x] Start/reuse Vite at http://127.0.0.1:4173/; if occupied by another server use Vite's next printed port without terminating processes.
- [x] Playwright MCP: open URL, select Haro Green, switch all stages, confirm visible model, absence of deployment controls and zero console errors. Capture desktop and 390x844 mobile final states.
- [x] Run requesting-code-review against `git diff HEAD` and `git status --short`; fix blocking findings and rerun affected checks.
- [x] Report changes, verification, review and URL with screenshots; preserve uncommitted changes and both workflow documents.
