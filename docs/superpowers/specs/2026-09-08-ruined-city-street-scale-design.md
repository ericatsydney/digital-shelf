# Ruined City Street-Scale Backdrop Design

## Summary

Refine the existing `ruined-city` stage into a street-canyon environment inspired by the supplied isometric robot-battle reference image. Preserve the existing stage entry and other stage variants. Add a minimal per-robot physical metadata field, `heightMeters`, and use it to normalize model scale so Haro can be deployed on a street at 18 meters tall.

## Goals

- Keep `ruined-city` as the selectable stage; do not add a new stage.
- Replace the current translucent box row with a readable 3D street scene.
- Show a central road, sidewalks/curbs, lane markings, and a few varied buildings on both sides.
- Make Haro's `heightMeters: 18` visible through believable street-scale relationships.
- Keep robot metadata extensible without adding width/depth fields yet.
- Preserve Hangar and Space behavior.
- Preserve reduced-motion support and robust JSON loading behavior.

## Non-goals

- Do not add a new city stage variant.
- Do not add robot width/depth metadata yet.
- Do not replace the scene with a flat reference-image texture.
- Do not redesign the roster or command-sheet UI.
- Do not change the existing model assets.

## Design

### Environment

`StageBackdrop` will continue to select the `ruined-city` renderer, but that renderer will become a deterministic street-canyon composition:

- A six-lane road recedes through the center of the scene, with three approximately 3.3 m lanes in each direction and a narrow center divider.
- Sidewalks approximately 2.4 m wide and curbs frame the road.
- Road markings and a subtle deployment pad anchor the selected robot.
- Approximately 3–4 varied building masses sit on each side behind the sidewalks. Buildings use 5–8 storeys at approximately 3.6–4.0 m per storey, producing 18–32 m building heights.
- Building footprints are approximately 10–18 m wide and 12–24 m deep, with the street corridor approximately 25–26 m wide before additional setbacks.
- Buildings use stepped heights, muted concrete/brick tones, rooftop details, and restrained warm window strips.
- The backdrop retains the existing dark ruined-city palette and scan/glow treatment.
- The road remains visually open around the robot.

The composition should feel like a stylized 3D/isometric street rather than a photorealistic city. The dimensions are based on real-world urban proportions: approximately 3.3 m travel lanes, 2.4 m baseline sidewalks, and 3.6–4.0 m floor-to-floor building increments. The visual signature is the contrast between the oversized deployed robot and the surrounding mid-rise street references.

### Robot metadata and scale

Extend `CollectionRecord` with:

```ts
heightMeters?: number;
```

`public/collection.json` will set Haro's value to `18`. `heightMeters` must be positive and finite when present. Records without the field remain valid for backward compatibility.

At render time, the selected model's geometry will be measured from its bounding box. When a valid `heightMeters` exists, the model is normalized to that target height and then multiplied by the existing authored `display.scale` value if present. If the geometry has no usable height, the renderer falls back to the existing authored scale rather than failing the scene.

The city composition uses a fixed 1 Three.js unit = 1 meter reference for environment dimensions. The city camera framing will be adjusted farther out so an 18 m Haro, the approximately 25–26 m street corridor, and the building context fit on initial load. Orbit controls remain enabled.

### Data flow

1. `loadCollection` fetches and validates collection records.
2. Haro arrives with `heightMeters: 18`; records without height remain usable.
3. `HeroCanvas` passes the selected record and stage to the scene.
4. `HeroModel` measures the loaded model and derives its scale from height metadata plus authored display scale.
5. `StageBackdrop` renders the street-canyon environment only for `ruined-city`.
6. Stage switching changes the environment/framing treatment; robot switching recalculates model scale while preserving the selected stage.

### Failure behavior

- Invalid `heightMeters` causes that collection record to be skipped, consistent with existing collection validation.
- Missing `heightMeters` is valid and uses current authored scale behavior.
- An unusable model bounding box falls back to authored scale and does not block the collection or stage.
- Existing stage-load errors and empty-state behavior remain unchanged.
- Reduced-motion users receive a static city backdrop with animation disabled.

## Acceptance criteria

- The existing Ruined City stage shows a six-lane central street with three lanes in each direction and buildings on both sides.
- The street roadway is approximately 19.8 m wide, sidewalks approximately 2.4 m wide each, and buildings approximately 18–32 m high.
- Haro is deployed on the road and reads as approximately 18 m relative to the environment.
- Street markings, sidewalks, building variation, and warm window accents are visible without obscuring Haro.
- Switching to Hangar or Space preserves their current backdrop behavior.
- Haro's JSON record contains `heightMeters: 18`.
- Collection validation accepts valid positive heights, rejects invalid heights, and preserves records without heights.
- A model with invalid or unavailable geometric height does not crash the stage.
- Existing tests plus new focused validation/scene tests pass.
- Type-check, unit tests, build, and Playwright verification pass.

## Test plan

- Unit tests for `validateCollectionRecord` with valid, missing, zero, negative, and non-finite height values.
- Scene tests for rendering the existing stage and model paths without regressions.
- Stage data tests confirming the existing `ruined-city` record remains valid.
- Build and browser smoke tests confirming the street scene loads and the Haro model remains selectable.
