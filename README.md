# Digital Shelf

Digital Shelf is a private, client-only tactical showcase for locally owned GLB/GLTF figure and Gunpla models. The MVP presents one selected hero model at a time, fixed deployment slots, local tactical stages, orbit controls, and PNG capture.

All collection metadata, models, stages, and runtime libraries are local to the built site. There is no backend, database, authentication, analytics, CDN asset, or remote model request.

## Requirements

- Node.js 20 or newer
- npm
- A Playwright-compatible Chromium browser for browser smoke tests (the browser is not installed by this project)

## Local development

Install dependencies:

```text
npm install
```

Start the Vite development server:

```text
npm run dev
```

Open the local URL printed by Vite. Local models are stored in `public/models/`, and collection/stage metadata is stored in `public/collection.json` and `public/stages.json`.

Run the unit test suite:

```text
npm run test
```

Run the browser smoke tests against the local app:

```text
npx playwright test
```

The smoke tests start Vite on `http://127.0.0.1:4173`, use the real local collection and `public/models/haro-green.glb`, and cover collection rendering, Haro selection, fixed-slot deployment, stage switching, hero presence, PNG capture, and the narrow mobile layout. If Playwright reports that Chromium is unavailable, install the browser separately only when you explicitly choose to do so.

## Production build and preview

Create the static production artifact:

```text
npm run build
```

The output is written to `dist/`. Preview that exact artifact locally:

```text
npm run preview
```

The production preview should serve `/collection.json`, `/stages.json`, and `/models/haro-green.glb` from the same origin.

## Cloudflare deployment

### Cloudflare Pages

Create a Pages project connected to this repository with:

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Vite (optional; the command and output directory are the important settings)

No environment variables are required for the MVP. Deploy the contents of `dist/` as static assets.

### Workers Static Assets alternative

The same `dist/` directory can be served by Cloudflare Workers Static Assets if edge configuration is needed later. Configure Wrangler's static asset directory to point at `dist/`; do not add a Worker handler unless a future requirement needs edge logic. The application remains a static client bundle and continues to load all metadata and GLB files from local, same-origin paths.

## Project structure

```text
public/                 Static collection data, stages, and GLB models
src/app/                App composition and responsive visual system
src/components/         Tactical command controls
src/data/               Local data loading and validation
src/scene/              React Three Fiber hero scene and capture
src/state/              Transient tactical reducer
tests/*.test.ts         Vitest unit/component tests
tests/*.smoke.spec.ts   Playwright browser smoke tests
```

The tactical deployment state is intentionally transient: refreshing or navigating back resets the current selection, slot, and stage to the default hangar state.
