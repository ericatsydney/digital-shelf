# Hangar and Forest Stage Design

Approved in chat on 2026-10-04 after choosing Hangar and Forest concept sketches.

## Requirements and scope

Expand the existing Hangar into a maintenance bay and replace the selectable Space stage with Forest. Keep Ruined City and the three-stage selector. Use local procedural geometry, without external assets or packages. Preserve model loading, orbit/pan/zoom, camera fitting, deployment controls, PNG capture, and responsive layout.

Hangar contains a spacious floor, steel enclosure and overhead beams, side catwalks, crates, overhead light strips, and yellow floor markings. Forest contains a central clearing, layered trees, rocks, a worn path, and light mist. Scenery surrounds the hero rather than blocking its initial camera view. Scale environments around the real collection model's declared 18m height, consistent with Ruined City.

## Architecture and interfaces

Add focused `HangarBackdrop.tsx` and `ForestBackdrop.tsx` components and deterministic layout helpers where needed. `StageBackdrop` dispatches by `StageBackdropConfig.variant`. Add `forest` to the variant union and validator. Retain support for legacy `space` configurations, but replace its public record with `forest`.

`public/stages.json` supplies Forest's dark green palette and lighting. `StageScene` provides shared illumination and stage-appropriate fog; hide the tactical grid for Forest so its ground reads naturally. Fog must clear when leaving Forest. Ground sits near the existing scene floor at y=-1.25.

Give Hangar and Forest sensible stage camera profiles with a modest downward angle. Continue fitting the camera to model bounds, resetting on stage selection, and prioritizing explicit unit camera metadata. Keep the clearing and bay open along that view. No animated Forest elements are required; static scenery respects reduced motion automatically.

## Data flow

Stage selection updates the existing reducer stage ID and camera reset revision. App resolves the record, HeroCanvas chooses its camera profile, StageBackdrop renders its local environment, and StageScene configures lighting/fog/grid. Existing model bounds trigger camera fitting. Capture exports the same rendered WebGL canvas.

## Failure behavior

Unknown/invalid stage records retain current validation behavior; omitted backdrop configuration still defaults to Hangar. Stage-data load failure retains the existing Hangar fallback. No new asynchronous assets or scenery loading failure states are introduced. Model errors retain `Model unavailable`.

## Acceptance criteria and tests

- Selector offers Hangar, Forest, and Ruined City; Space is absent from the shipped selector.
- Hangar reads as an enclosed maintenance bay; Forest reads as a clearing with a path, trees, rocks, and mist.
- Haro remains fully framed and visible; the initial camera view is not obstructed by scenery.
- Switching stages resets fitted framing and clears Forest fog on other stages.
- Orbit/pan/zoom and capture work in both stages, with no browser console errors.
- Validator tests cover Forest and malformed variants, shipped metadata, and legacy Space compatibility.
- Layout tests cover deterministic placement and central clearance; camera tests cover defaults and explicit overrides.
- Browser tests cover all three stages, a PNG download, and mobile switching.
- Run type-check, full unit tests, build, and Playwright suite, then Playwright MCP user-flow verification and screenshots.

## Review

Reviewed for scope, interfaces, failure handling, and acceptance coverage. Documents stay uncommitted per AGENTS.md. Implementation is authorized by the user's design approval in chat.
