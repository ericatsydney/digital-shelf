# Digital Shelf

Digital Shelf is a private, client-only tactical showcase for locally owned GLB/GLTF figure and Gunpla models. The MVP presents one selected hero model at a time, local tactical stages, orbit controls, and PNG capture.

All collection metadata, models, stages, and runtime libraries are local to the built site. There is no backend, database, authentication, analytics, CDN asset, or remote model request.

The three stages surround the hero with local geometry: Hangar is a maintenance bay with steel beams, catwalks, crates and floor markings; Forest is a clearing with layered trees, rocks, a worn path and mild distance fog; Ruined City remains a damaged urban roadway. Stage changes restore a fitted camera view, with orbit, pan and zoom available afterward. Forest hides the tactical grid, and its fog is included in PNG captures.

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

The smoke tests start Vite on `http://127.0.0.1:4173`, use the real local collection and `public/models/light-guncannon.glb`, and cover collection rendering, Haro selection, absence of deployment controls, stage switching, hero presence, PNG capture, and the narrow mobile layout. If Playwright reports that Chromium is unavailable, install the browser separately only when you explicitly choose to do so.

## Production build and preview

Create the static production artifact:

```text
npm run build
```

The output is written to `dist/`. Preview that exact artifact locally:

```text
npm run preview
```

The production preview should serve `/collection.json`, `/stages.json`, and `/models/light-guncannon.glb` from the same origin.

## Generate a model from images (Tripo)

Turns 1 image, or 2-4 images of the same object (front, left, back, right order; filenames containing `front`/`back`/`left`/`right` are honoured), into one GLB (untextured unless `--texture` is given) and registers it in `public/collection.json`.

One-time setup:

1. `npm install -g tripo-cli` (Node 20+).
2. Copy `.env.example` to `.env.local` (or `.env`) and set `TRIPO_API_KEY`. `.env.local` is git-ignored. Never commit keys.

Run:

```powershell
npm run model:generate -- front.png back.png --title "Test Model" --height 18
```

The app never measures a model at runtime: the command measures the raw GLB and stores `display.scale` (from `--height`) and `display.groundOffset` in the record, and each stage has a fixed camera tuned for a figure about 20 m tall (a much taller or shorter figure needs its own `camera` in the record).

Options: `--id`, `--category` (default `Figure`), `--description`, `--tags a,b`, `--height <meters>`, `--texture` (generate colour textures; larger files and more credits), `--force` (overwrite an existing id). The command stops before spending credits if the id already exists.

After generating, the model is Meshopt-compressed automatically (the app decodes it locally, with no extra request) and must come out under 25 MiB, the Cloudflare per-file limit; otherwise nothing is installed and the raw GLB is kept in a temp folder whose path is printed.

## Cloudflare deployment

### Cloudflare Pages

Create a Pages project connected to this repository with:

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Vite (optional; the command and output directory are the important settings)

No environment variables are required for the MVP. Deploy the contents of `dist/` as static assets.

### Cloudflare Workers (Workers Builds)

`wrangler.jsonc` publishes `dist/` as Workers Static Assets, with single-page-app fallback and no Worker handler. Connect the repository to a Worker named `digital-shelf` and set, under Settings -> Builds:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variable `NODE_VERSION=22` if the build reports an unsupported Node version

Every push to `main` then builds and deploys automatically. The application remains a static client bundle and loads all metadata and GLB files from same-origin paths (each file must stay under the 25 MiB asset limit).

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

The tactical showcase state is intentionally transient: refreshing or navigating back resets the current selection and stage to the default hangar state.
