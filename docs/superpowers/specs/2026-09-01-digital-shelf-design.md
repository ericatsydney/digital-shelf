# Digital Shelf Design Specification

Date: 2026-09-01
Status: Approved for implementation planning

## Purpose

Digital Shelf is a personal web app for displaying a collection of figures, Gunpla, and 3D prints as interactive 3D models. The first release is private and personal, with no account system, sharing, backend, or cloud storage.

The initial experience is a collection gallery with inline 3D previews. Selecting an item opens a full viewer where the user can inspect the model, change the scene background, and capture a PNG photo.

## First milestone

The first milestone is complete when the user can:

1. Open the app and see a collection grid populated from local data.
2. See an inline 3D preview for each collection item.
3. Click a collection item to open its full viewer.
4. Orbit, zoom, and pan around the selected model.
5. Change the background using preset options.
6. Download a PNG capture of the current viewer canvas.

A sample model and sample records will be included so the app can be evaluated immediately.

## Technical approach

Use a Vite web app with Three.js. This keeps the first version small while providing direct support for GLB and GLTF assets, camera controls, scene lighting, canvas rendering, and browser image export.

The application is split into three boundaries:

- `app/`: web UI and rendering behavior.
- `data/`: collection metadata and scene configuration.
- `models/`: raw GLB/GLTF model files and related source assets.

The viewer consumes a model record through a stable data interface. It must not contain model-specific conditionals. This boundary leaves room for a later iPhone client using the same collection concepts and asset metadata, while the web renderer and native renderer remain separate.

## User experience

### Gallery

The home screen presents the collection as cards. Each card includes the model name, category, and an inline 3D preview. The user can click a card or an explicit viewer action to open that model.

The gallery is the primary navigation surface. There is no required search, authentication, editing workflow, or multi-page dashboard in this milestone.

### Full viewer

The full viewer displays one selected model in a large Three.js canvas. It provides:

- Orbit, zoom, and pan controls.
- Background preset selection.
- A return-to-gallery action.
- A photo capture action that downloads the current canvas as a PNG.

The viewer starts from camera and display settings stored on the model record when present, with sensible defaults otherwise.

## Data model

Collection data is version-controlled JSON. Each model record contains:

- `id`: stable unique identifier.
- `title`: display name.
- `category`: figure, Gunpla, 3D print, or another personal category.
- `description`: optional short description.
- `model`: relative path to the GLB/GLTF asset.
- `thumbnail`: optional preview image path.
- `camera`: optional initial camera position and target.
- `display`: optional background, lighting, scale, or placement settings.

The app loads the collection data, validates the fields it needs, and passes a selected record to the gallery preview or full viewer. Adding a model should require adding an asset and a data record, not changing rendering code.

## Failure behavior

- If the collection data cannot load, the app shows an error state explaining that the collection is unavailable.
- If a record is missing required fields, the app skips that record and shows a non-blocking notice.
- If a model asset fails to load, its card or viewer shows “Model unavailable” with a way to return to the gallery.
- If PNG capture fails or download is blocked, the viewer shows a clear capture error without losing the current scene.

## Testing and acceptance

Test the data-to-UI path, gallery selection, viewer controls, background changes, photo capture, model-loading failure state, and phone-sized layout behavior. The initial test suite can use a known sample model and browser-level smoke checks; it does not need a backend or device farm.

The app should remain usable at a narrow mobile viewport even though native iPhone packaging is outside this milestone.

## Out of scope

- User accounts or authentication.
- Cloud model storage or database persistence.
- Public sharing or social features.
- In-app model editing or conversion.
- AR placement.
- Native iPhone implementation.
- Automatic import from a 3D asset library.

## Future direction

The data and asset boundary should support a later iPhone app built with Swift and RealityKit or SceneKit. That future app can use the same model metadata conventions while implementing native rendering, photo capture, and device-specific interaction separately.
