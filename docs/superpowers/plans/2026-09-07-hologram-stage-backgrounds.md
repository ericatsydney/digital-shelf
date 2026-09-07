# Hologram Stage Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Hangar, Space, and Ruined City stage options distinct CSS/Three.js hologram atmospheres while preserving the active model, controls, capture action, and static deployment.

**Architecture:** Extend the validated `StageRecord` with a small typed backdrop configuration. Render a focused `StageBackdrop` R3F component inside the existing hero canvas for captured visuals, and add stage-keyed CSS layers for scanlines, glow, and atmosphere around the canvas. Stage switching changes backdrop props only; it does not change the model request ID or remount the GLB.

**Tech Stack:** React, TypeScript, React Three Fiber, Three.js, CSS, Vitest, Playwright, Vite.

---

## File map

- Modify `src/app/types.ts`: define backdrop variant/config fields on `StageRecord`.
- Modify `src/data/stages.ts`: validate optional backdrop fields and provide safe defaults for older records.
- Modify `public/stages.json`: configure Hangar, Space, and Ruined City visual variants.
- Create `src/scene/StageBackdrop.tsx`: render deterministic procedural scene elements for each variant.
- Modify `src/scene/HeroCanvas.tsx`: mount `StageBackdrop` and expose the active variant as a data attribute for CSS.
- Modify `src/app/app.css`: add non-image hologram atmosphere layers and reduced-motion rules.
- Modify `tests/stages.test.ts`: test backdrop validation/default behavior.
- Modify `tests/app.smoke.spec.ts`: test stage-specific markers, model persistence, and capture availability.

## Task 1: Define and validate stage backdrop configuration

**Files:** `src/app/types.ts`, `src/data/stages.ts`, `public/stages.json`, `tests/stages.test.ts`

- [ ] **Step 1: Write failing validation tests.** Add tests for a valid record with `backdrop` fields and an older valid record without them. The first preserves configured values; the second receives Hangar-compatible defaults.

```ts
import { describe, expect, it } from 'vitest';
import { validateStageRecord } from '../src/data/stages';

describe('stage backdrop validation', () => {
  it('accepts a configured hologram backdrop', () => {
    expect(validateStageRecord({
      id: 'space', name: 'Space', background: '#02040c', gridColor: '#29336d',
      accentColor: '#8d9cff', ambientIntensity: 0.35, directionalIntensity: 0.85,
      backdrop: { variant: 'space', particleCount: 80, motion: 0.4 },
    })).toMatchObject({ backdrop: { variant: 'space', particleCount: 80, motion: 0.4 } });
  });

  it('adds safe Hangar defaults when backdrop is omitted', () => {
    expect(validateStageRecord({
      id: 'hangar', name: 'Hangar', background: '#07111f', gridColor: '#284c6e',
      accentColor: '#55d6ff', ambientIntensity: 0.6, directionalIntensity: 1.2,
    })).toMatchObject({ backdrop: { variant: 'hangar', particleCount: 0, motion: 0 } });
  });
});
```

- [ ] **Step 2: Run `npm run test -- tests/stages.test.ts`; expect failure because backdrop is not typed or validated yet.**
- [ ] **Step 3: Add `StageBackdropConfig` with `variant: 'hangar' | 'space' | 'ruined-city'`, finite non-negative `particleCount`, and finite non-negative `motion`. Make validated `StageRecord.backdrop` required, normalize omitted settings to `{ variant: 'hangar', particleCount: 0, motion: 0 }`, and skip records with invalid explicit backdrop settings.**
- [ ] **Step 4: Add these values to `public/stages.json`: Hangar `{ "variant": "hangar", "particleCount": 0, "motion": 0.2 }`, Space `{ "variant": "space", "particleCount": 72, "motion": 0.35 }`, and Ruined City `{ "variant": "ruined-city", "particleCount": 12, "motion": 0.12 }`.**
- [ ] **Step 5: Run `npm run test -- tests/stages.test.ts`; expect PASS.**

## Task 2: Add the procedural R3F backdrop

**Files:** `src/scene/StageBackdrop.tsx`, `src/scene/HeroCanvas.tsx`, `tests/app.smoke.spec.ts`

- [ ] **Step 1: Add a failing Playwright assertion that the hero canvas exposes `data-backdrop-variant="hangar"` initially and changes to `space` after selecting Space.**
- [ ] **Step 2: Run `npx playwright test tests/app.smoke.spec.ts -g "backdrop variant"`; expect failure because the attribute does not exist.**
- [ ] **Step 3: Create `StageBackdrop` accepting `StageBackdropConfig` and stage colors. Render low-cost deterministic primitives: cyan rings and bay markers for Hangar, a seeded `points` cloud with capped drift for Space, and warm translucent skyline boxes plus a scan ring for Ruined City. Use `useMemo`, avoid per-frame allocations, and skip `useFrame` updates when motion is zero.**
- [ ] **Step 4: Mount `<StageBackdrop stage={stage} config={stage.backdrop} />` beside `StageScene` in `HeroCanvas`, and add `data-backdrop-variant={stage.backdrop.variant}` to `.hero-canvas`. Do not key the backdrop by `requestId` or `unit.id`.**
- [ ] **Step 5: Run the focused Playwright test; expect PASS with the model canvas still visible after stage changes.**

## Task 3: Add CSS atmosphere and reduced-motion behavior

**Files:** `src/app/app.css`, `src/scene/HeroCanvas.tsx`, `tests/app.smoke.spec.ts`

- [ ] **Step 1: Add a failing smoke assertion that Hangar, Space, and Ruined City expose distinct stage markers while the canvas remains visible.**
- [ ] **Step 2: Add pointer-events-none pseudo-element layers keyed by `data-backdrop-variant`: cyan bay glow and scanlines for Hangar; violet glow and sparse stars for Space; orange haze, vertical scanlines, and a low skyline gradient for Ruined City. Keep them behind the canvas and below the capture button.**
- [ ] **Step 3: Add `@media (prefers-reduced-motion: reduce)` rules that reduce CSS animation to a single near-instant iteration, and make `StageBackdrop` use an effective motion of zero when the media query matches.**
- [ ] **Step 4: Run `npm run test -- tests/stages.test.ts` and `npx playwright test tests/app.smoke.spec.ts -g "stage"`; expect PASS.**

## Task 4: Verify capture, regression behavior, and repository requirements

**Files:** `tests/app.smoke.spec.ts`

- [ ] **Step 1: After selecting Space and Ruined City, assert the active model text and canvas remain visible, Capture PNG remains enabled, and no second model request occurs. Keep the existing stage background assertion as a fallback-level check.**
- [ ] **Step 2: Run the required verification sequence in order:**

```powershell
npx tsc -b --pretty false
npm run test
npm run build
npx playwright test
```

Expected: every command exits successfully; any failure blocks code review.

- [ ] **Step 3: Start `npm run dev -- --host 127.0.0.1 --port 4173`; report the exact URL if Vite chooses another available port, without terminating an existing process.**
- [ ] **Step 4: Review `git diff HEAD` and `git status --short` with the code-review skill. Critical and Important findings block completion; fix them and rerun affected tests.**
- [ ] **Step 5: Report changed files, verification results, review status, and local URL. Do not commit unless explicitly requested.**

