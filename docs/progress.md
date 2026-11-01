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
2. [x] **Ruined City ash mist** — low warm ground haze plus sparse falling ash and rising embers (one ninth of the prototype particles, a third of its haze, slow gusting motion; light shafts not chosen). GPU only; skipped on software WebGL; frozen with reduced motion. Uncommitted.
   - Forest brightened (sky fill light, warmer sun, exposure 1.12, lighter vignette) and tree sway made slower and gentler. Uncommitted.
3. [ ] **2D painted stage trial** — one new stage mixing 3D model with layered painted backdrop (parallax), possibly toon/outline shading. Art must be original or licensed — no official Gundam artwork.

## Next step

Review the ash mist in the app and commit it if happy; then brainstorm item 3 (2D painted stage trial). Known: Playwright test "opens the mobile unit dropdown upward" times out under software rendering on this machine, also on commit fa00770 (pre-existing).
