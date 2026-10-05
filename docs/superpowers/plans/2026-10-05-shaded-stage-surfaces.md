# Shaded Stage Surfaces Implementation Plan

> For agentic workers: use subagent-driven development with a bounded write scope and review the completed task before continuing. Do not commit.

**Goal:** Shade Hangar painted markings and Ruined City solid scenery using existing lights.

**Architecture:** Use existing React Three Fiber meshStandardMaterial surfaces. Preserve luminous basic materials and all scene geometry and lighting.

**Tech Stack:** React, TypeScript, Three.js, Vitest, Playwright.

## Task 1: Materials and regression coverage
Files: src/scene/HangarBackdrop.tsx, src/scene/StageBackdrop.tsx, tests/backdropMaterials.test.tsx.

- [x] Write a test traversing actual rendered React element trees to find meshes by geometry and material color. Assert yellow Hangar paint and city building/road/sidewalk/divider/curb/pad surfaces are standard materials; assert luminous windows and light strips remain basic.
- [x] Run `npm run test -- tests/backdropMaterials.test.tsx`; expect failures for current basic solid materials.
- [x] Change Hangar yellow paint to `<meshStandardMaterial color="#d1ae45" roughness={0.9} />`. Change city solid surfaces to standard materials with roughness 0.9–1 and default nonmetallic finish, retaining color and transparency/opacity. Do not change luminous accents or geometry.
- [x] Run `npm run test -- tests/backdropMaterials.test.tsx`; expect pass. Inspect diff against approved spec before continuing.

## Task 2: Verification and review
- [x] Run `npx tsc -b --pretty false`, `npm run test`, `npm run build`, and `npx playwright test`; expect all exit codes 0. Stop before review if any fails.
- [x] Start Vite with `npm run dev -- --host 127.0.0.1 --port 4173`; use the printed URL if port is occupied, without stopping other processes.
- [x] In Playwright MCP open the URL, click Haro Green, switch Hangar/Forest/Ruined City, confirm canvas rendering and check console errors. Capture final Hangar and Ruined City screens.
- [x] Review `git diff HEAD` and `git status --short` using requesting-code-review. Fix Critical/Important findings and rerun affected checks. Report Minor findings.
- [x] Return screenshots, test results, review status, and exact verification URL. Leave both workflow documents and all code uncommitted.

