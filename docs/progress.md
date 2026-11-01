# Digital Shelf progress

_Updated 2026-11-01_

## Long-term goal

A collector's showcase for 3D figure models: striking presentation first, then a curated, shareable collection.

- [x] First-session polish from the CEO review (default unit on arrival, retry, load progress, controls hint, capture caption/filename/notice, mobile guard) — commit `fa00770`
- [ ] Presentation-layer "wow factor" (current focus, see below)
- [ ] On hold: browsable roster with search/filter
- [ ] On hold: shareable collection (static export/share package)
- [ ] On hold: privacy-conscious usage signals

## Short-term goal: presentation wow factor

Tackle in this order; each gets its own brainstorm → spec → plan → TDD cycle.

1. [x] **Premium model look** — after review, reduced to a colour grade + vignette on every stage (rim lights, reflections, ground shadows and glow were tried and rejected). Software-WebGL browsers keep the plain look. Uncommitted; spec/plan `docs/superpowers/*/2026-11-01-cinematic-look*`.
2. [ ] **Ruined City ash mist** — low warm haze, drifting ash particles extending the embers, optional light shafts.
3. [ ] **2D painted stage trial** — one new stage mixing 3D model with layered painted backdrop (parallax), possibly toon/outline shading. Art must be original or licensed — no official Gundam artwork.

## Next step

Review the cinematic look in the app; then brainstorm item 2 (Ruined City ash mist). Known: Playwright test "opens the mobile unit dropdown upward" times out under software rendering on this machine, also on commit fa00770 (pre-existing).
