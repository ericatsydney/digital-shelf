---
name: add-model
description: Add a new 3D model (e.g. a gunpla figure) to the Digital Shelf from photos in the synced Google Drive folder. Use when the user asks to add, generate or install a new model on the shelf.
---

# Add a model to Digital Shelf

Follow AGENTS.md as well (clean git gate, spec/plan left uncommitted, full verification, no commits).

## 1. Find the photos
- The user keeps photos in a synced Google Drive folder, `digital-shelf/<model-name>/`. Find where Drive is mounted on this machine from the agent's memory (reference note) or ask the user; do not guess drive letters.
- List only that model's folder, never the whole Drive root (it holds unrelated personal files).
- Expect 1-4 photos, often HEIC. If the user gave no name, ask which folder.

## 2. Convert HEIC to JPG
`sharp` cannot decode HEVC HEIC here. Use a throwaway venv in the scratchpad:
- `python -m venv venv`, `venv/Scripts/pip install pillow pillow-heif`
- `pillow_heif.register_heif_opener()`, open with PIL, `ImageOps.exif_transpose`, `thumbnail((1600,1600))`, save JPEG quality 90.
- Look at every JPG to decide the view order. Tripo wants front, left, back, right (left = the figure's left side).
- Copy to `assets/source-images/<id>-front|left|back|right.jpg` (git-ignored).

## 3. Generate
Key comes from the git-ignored `.env` (`TRIPO_API_KEY`). Never print, log or commit it; pipe output through `sed -E 's/tsk_[A-Za-z0-9]+/[redacted]/g'`. Costs about 30 credits; run in the background (several minutes).

```bash
npm run model:generate -- assets/source-images/<id>-front.jpg assets/source-images/<id>-left.jpg assets/source-images/<id>-back.jpg assets/source-images/<id>-right.jpg --title "Name" --category Figure --description "..." --tags gunpla,mobile-suit --height <meters> --texture
```
Writes `public/models/<id>.glb` and appends to `public/collection.json`. Height: use the canonical figure height if known, otherwise estimate and say so.

## 4. Finish the entry
- If the model faces sideways in the browser, add `"rotationYDegrees": 90` (or -90) to its `display` block.
- Update `tests/app.smoke.spec.ts`: the `N units` count and add a click on the new unit's button. Keep the 120 s timeouts on the heavy 3D tests.

## 5. Verify
`npx tsc -b --pretty false`, `npm run test`, `npm run build`, `npx playwright test` (about 6 minutes; close extra browser tabs first or it can time out), the AGENTS.md secret check, then start Vite on port 4173, click the new unit and confirm it renders facing the camera with no console errors. Write the spec and plan under `docs/superpowers/` and leave them uncommitted.
