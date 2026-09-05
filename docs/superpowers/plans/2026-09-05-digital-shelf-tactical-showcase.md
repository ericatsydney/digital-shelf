# Digital Shelf Tactical Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, client-only tactical showcase for locally owned GLB/GLTF models, deployable as a static Vite build to Cloudflare Pages or Workers Static Assets.

**Architecture:** React owns the responsive command UI and transient tactical state. React Three Fiber owns the Three.js hero scene, while a collection loader/validator provides typed model records from local JSON. Large GLB files remain public static assets and load only for the selected hero unit.

**Tech Stack:** Vite, React, TypeScript, Three.js, React Three Fiber, Drei, Vitest, Testing Library, Playwright, npm.

---

## File map

Create the following focused files:

- `package.json` — scripts and dependencies.
- `index.html` — Vite entry document.
- `vite.config.ts` — Vite configuration and test integration.
- `tsconfig.json` — TypeScript configuration.
- `src/main.tsx` — React bootstrap.
- `src/app/App.tsx` — top-level screen and state composition.
- `src/app/app.css` — responsive visual system and layout.
- `src/app/types.ts` — collection, stage, and tactical-state types.
- `src/data/collection.ts` — collection loading and validation.
- `src/data/stages.ts` — stage loading and validation.
- `src/state/tacticalState.ts` — pure transient state transitions.
- `src/components/Roster.tsx` — unit selection UI.
- `src/components/DeploymentSlots.tsx` — fixed-slot UI.
- `src/components/CommandSheet.tsx` — mobile/desktop responsive controls.
- `src/components/UnitIdentity.tsx` — identity-only metadata panel.
- `src/components/StageControls.tsx` — stage selection.
- `src/components/CaptureButton.tsx` — PNG capture action and error state.
- `src/scene/HeroCanvas.tsx` — R3F canvas boundary.
- `src/scene/HeroModel.tsx` — selected GLB lifecycle and stale-load protection.
- `src/scene/StageScene.tsx` — lighting, background, grid treatment, and camera framing.
- `src/scene/useCapture.ts` — canvas capture function.
- `public/collection.json` — local collection records.
- `public/stages.json` — local stage presets.
- `public/models/haro-green.glb` — existing sample model copied or retained here.
- `tests/collection.test.ts` — loader/validator unit tests.
- `tests/tacticalState.test.ts` — state transition tests.
- `tests/app.smoke.spec.ts` — browser smoke tests.
- `README.md` — local setup and Cloudflare deployment instructions.

Do not add a backend, API routes, database, authentication, router, state-management library, Worker handler, analytics, CDN dependency, or local metadata editor.

## Task 1: Scaffold the Vite client

**Files:** Create `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`.

- [ ] **Step 1: Define package scripts and dependencies.**

Use these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Dependencies must include `react`, `react-dom`, `three`, `@react-three/fiber`, and `@react-three/drei`. Dev dependencies must include TypeScript, Vite, the React Vite plugin, Vitest, Testing Library, jsdom, and Playwright.

- [ ] **Step 2: Create the Vite entry and React bootstrap.**

`index.html` must contain `<div id="root"></div>` and load `/src/main.tsx`. `src/main.tsx` must call `createRoot(document.getElementById('root')!)` and render `<App />`.

- [ ] **Step 3: Configure Vite and TypeScript.**

Configure the React plugin, `base: '/'`, and Vitest with `environment: 'jsdom'` and a setup file only if required by the tests. Enable strict TypeScript and include `src` and `tests`.

- [ ] **Step 4: Run the scaffold checks.**

Run:

```text
npm install
npm run build
npm run test
```

Expected result: the build succeeds and Vitest reports no test files yet without failing the command.

## Task 2: Define typed local data and validation

**Files:** Create `src/app/types.ts`, `src/data/collection.ts`, `src/data/stages.ts`, `public/collection.json`, `public/stages.json`, `tests/collection.test.ts`.

- [ ] **Step 1: Define the stable records.**

Use these TypeScript shapes:

```ts
export type CollectionRecord = {
  id: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  model: string;
  thumbnail?: string;
  camera?: { position: [number, number, number]; target: [number, number, number] };
  display?: { stageId?: string; scale?: number };
};

export type StageRecord = {
  id: string;
  name: string;
  background: string;
  gridColor: string;
  accentColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
};
```

- [ ] **Step 2: Implement collection loading.**

`loadCollection(url: string): Promise<{ records: CollectionRecord[]; skipped: number }>` must fetch JSON, reject a non-OK response as `collection-error`, treat a non-array payload as invalid, preserve valid records, skip records missing non-empty `id`, `title`, `category`, or `model`, and report the skipped count. It must never throw a record-level validation error.

- [ ] **Step 3: Implement stage loading.**

`loadStages(url: string): Promise<StageRecord[]>` must validate IDs, names, colors, and finite intensity values. If stage data fails, the caller must be able to use a built-in Hangar fallback and display a diagnostic.

- [ ] **Step 4: Add initial JSON.**

`public/collection.json` must include the existing Haro model with identity-only metadata and a model path `/models/haro-green.glb`. `public/stages.json` must include exactly three initial stages: Hangar, Space, and Ruined City.

- [ ] **Step 5: Write and run unit tests.**

Cover valid records, missing required fields, empty arrays, non-array JSON, non-OK fetch responses, invalid stage values, and skipped-count reporting.

Run:

```text
npm run test -- tests/collection.test.ts
```

Expected result: all loader and validator tests pass.

## Task 3: Implement transient tactical state

**Files:** Create `src/state/tacticalState.ts`, `tests/tacticalState.test.ts`.

- [ ] **Step 1: Define the state and actions.**

```ts
export type TacticalState = {
  selectedUnitId: string | null;
  selectedSlotId: string | null;
  stageId: string;
  unitStatus: 'idle' | 'loading' | 'ready' | 'error';
  captureStatus: 'idle' | 'capturing' | 'error';
  loadRequestId: number;
};

export type TacticalAction =
  | { type: 'select-unit'; unitId: string }
  | { type: 'select-slot'; slotId: string }
  | { type: 'select-stage'; stageId: string }
  | { type: 'unit-ready'; requestId: number }
  | { type: 'unit-error'; requestId: number }
  | { type: 'capture-start' }
  | { type: 'capture-error' }
  | { type: 'capture-reset' };
```

- [ ] **Step 2: Implement the pure reducer.**

Selecting a unit must increment `loadRequestId`, set `unitStatus` to `loading`, and make the newest selection authoritative. `unit-ready` and `unit-error` must be ignored when their request ID is not current. The initial state must select no unit, no slot, and Hangar.

- [ ] **Step 3: Test state transitions.**

Cover initial state, unit selection, fixed-slot selection, stage changes, stale ready/error actions, capture error/reset, and transient reset behavior.

Run:

```text
npm run test -- tests/tacticalState.test.ts
```

Expected result: all reducer tests pass.

## Task 4: Build the responsive command UI

**Files:** Create `src/app/App.tsx`, `src/components/Roster.tsx`, `src/components/DeploymentSlots.tsx`, `src/components/CommandSheet.tsx`, `src/components/UnitIdentity.tsx`, `src/components/StageControls.tsx`, `src/components/CaptureButton.tsx`, `src/app/app.css`.

- [ ] **Step 1: Compose the loading, empty, partial, and error states.**

`App` must load collection and stages on mount, expose visible messages for collection loading/error/empty/partial states, and render the roster and hero area when records are available. A partial notice must state how many records were skipped.

- [ ] **Step 2: Implement roster and fixed slots.**

Roster buttons must use stable unit IDs, be keyboard reachable, show selected state, and dispatch `select-unit`. Fixed slots must be buttons with visible selected state and dispatch `select-slot`; they must not implement drag-and-drop.

- [ ] **Step 3: Implement identity and stage controls.**

Identity shows only title, category, description, and tags. Stage controls use buttons or a select with accessible labels and dispatch `select-stage`.

- [ ] **Step 4: Implement the hero-dominant responsive layout.**

The hero canvas must occupy the primary visual area. On narrow viewports, roster, identity, stages, slots, and capture controls become a bottom command sheet. Do not hide required controls behind hover-only interactions.

- [ ] **Step 5: Add loading and failure copy.**

Use exact user-facing categories: `Loading unit…`, `Model unavailable`, `Collection unavailable`, `No units available`, `Some units were skipped`, and `Capture failed. Try again.`

## Task 5: Implement the R3F hero scene

**Files:** Create `src/scene/HeroCanvas.tsx`, `src/scene/HeroModel.tsx`, `src/scene/StageScene.tsx`.

- [ ] **Step 1: Create the Canvas boundary.**

`HeroCanvas` must render a responsive `<Canvas>` with a transparent or stage-controlled background, orbit controls, camera defaults, and `StageScene`. It must render the selected model only.

- [ ] **Step 2: Implement GLB loading with stale-load protection.**

`HeroModel` must load the selected record’s model URL, use a request ID or selected-unit identity to reject stale completion, display a loading state, display `Model unavailable` on failure, apply record scale/camera when provided, and dispose replaced scene resources where ownership permits.

- [ ] **Step 3: Implement stage presets.**

`StageScene` must map the active `StageRecord` to background color, grid treatment, ambient light, directional light, and accent presentation. The mapping must be data-driven; no model-specific conditionals are allowed.

- [ ] **Step 4: Verify the real model locally.**

Run the dev server and load `/models/haro-green.glb`. Confirm the model renders, orbit controls work, and switching stages does not reload the model unnecessarily.

## Task 6: Implement PNG capture

**Files:** Create `src/scene/useCapture.ts`; modify `src/components/CaptureButton.tsx`, `src/scene/HeroCanvas.tsx`.

- [ ] **Step 1: Define the capture contract.**

```ts
export type CaptureResult =
  | { ok: true; filename: string }
  | { ok: false; code: 'canvas-unavailable' | 'to-data-url-failed' | 'download-failed' };
```

- [ ] **Step 2: Capture the current canvas without replacing scene state.**

Use the current renderer canvas, convert it to PNG, create a temporary download link, click it once, and remove it in `finally`. Convert thrown errors into the named result codes; never clear or recreate the active scene.

- [ ] **Step 3: Wire visible status and retry.**

Disable the button only while capturing, display `Capture failed. Try again.` for a failure, and allow retry after failure.

## Task 7: Add browser smoke tests and production checks

**Files:** Create `playwright.config.ts`, `tests/app.smoke.spec.ts`, `README.md`.

- [ ] **Step 1: Configure a local browser target.**

Run Vite on a fixed test port and configure Playwright to use the real local app. The test must not depend on network requests or remote models.

- [ ] **Step 2: Test the happy path.**

Verify collection rendering, Haro selection, fixed-slot selection, hero loading, stage change, visible identity metadata, and capture-button interaction.

- [ ] **Step 3: Test failure and edge paths.**

Use test fixtures or route interception to verify collection failure, skipped invalid records, missing GLB, stale selection, capture error, and empty collection. Verify that the roster remains usable after a model error.

- [ ] **Step 4: Test mobile layout.**

Run at a narrow viewport and verify the hero remains visible, the command sheet is reachable, controls have accessible names, and no required action is hover-only.

- [ ] **Step 5: Verify the production artifact.**

Run:

```text
npm run build
npm run preview
npx playwright test
```

Expected result: the build completes, the preview serves `dist`, all smoke tests pass, and `/models/haro-green.glb` resolves from the production preview.

- [ ] **Step 6: Document deployment.**

README must document `npm install`, `npm run dev`, `npm run build`, `npm run preview`, Cloudflare Pages build command `npm run build`, output directory `dist`, and Workers Static Assets as the compatible alternative.

## Task 8: Final review and user-owned commit

**Files:** All implementation files and documentation created above.

- [ ] **Step 1: Run the complete verification suite.**

```text
npm run test
npm run build
npx playwright test
git diff --check
```

- [ ] **Step 2: Check the static-only constraint.**

Confirm there are no server imports, API routes, analytics calls, remote asset URLs, secrets, or Worker handlers. Confirm all model and metadata references are local.

- [ ] **Step 3: Review the final file list and untracked personal assets.**

Do not delete or overwrite the existing GLB, review notes, or user-owned files. Do not commit automatically; the user will stage and commit the final changes.

## Plan self-review

- **Spec coverage:** local client-only architecture, Vite build, React/R3F/Three.js stack, fixed slots, one hero model, local stage presets, transient state, identity metadata, explicit failures, stale-load protection, PNG capture, mobile layout, smoke tests, Cloudflare Pages, Workers Static Assets, and no backend are covered by Tasks 1–8.
- **Placeholder scan:** all steps contain concrete paths, commands, interfaces, expected results, and named failure behavior.
- **Type consistency:** `CollectionRecord`, `StageRecord`, `TacticalState`, `TacticalAction`, and `CaptureResult` are defined before their consumers and use consistent field names.
- **User constraint:** no implementation or commit is part of this planning turn; the final commit remains user-controlled.
