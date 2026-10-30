# Digital Shelf CEO Product Review

**Date:** 2026-10-31  
**Status:** Advice for future product work; no implementation scope approved here.

## Current product

Digital Shelf is a client-only viewer for locally owned GLB/GLTF figure models. It presents one selected model at a time, offers three tactical stages, camera controls, and PNG capture. The current implementation has no backend, accounts, analytics, or remote model requests.

The strongest product outcome to pursue is helping collectors **curate, explore, and share a collection**. The 3D render is the draw; collection and sharing are what could make people return.

## Product direction

**Current state → next step → 12-month ideal:** a striking single-model scene → a polished, shareable collection experience → a trusted digital home for a collector’s models, with curation and reliable sharing at its core.

### Strategic options

| Approach | Summary | Effort / risk | Trade-offs |
|---|---|---|---|
| Minimal viable | Make the first visit immediately rewarding: select a model by default, clarify controls, improve mobile layout, and polish capture. | S / Low | Quick way to reduce friction; does little to help people manage or share a larger collection. |
| Shareable collection *(recommended)* | Keep the local-first approach while making collections easier to browse, curate, and export or share as a static package. | M / Medium | Builds on the existing collection and capture model; requires a clear share format and good mobile performance. |
| Ideal architecture | Add hosted collection storage, accounts, cross-device sync, collaboration, and richer collection management. | XL / High | Enables a broader platform; adds privacy, security, support, and operating costs before demand is established. |

**Recommendation:** take the shareable-collection path, but begin with the minimal first-visit improvements. A backend and accounts are a larger, less reversible bet; validate repeat use and sharing interest first.

## Live experience and UI/UX

The deployed site was opened and Light Guncannon was selected. It loaded successfully in the narrow browser view after a delay. The browser reported a Three.js deprecated-clock warning, but no errors. The initial state showed an empty display and required a roster selection before any model appeared.

The supplied desktop screenshot shows the experience at its best: the model is prominent, the forest creates a strong sense of scale, and the stage icons are compact. Key opportunities:

1. **Show something immediately.** Start with a default model when the collection is available, or show a deliberate welcome state with a visible “Choose a model” action and a collection count. An empty canvas should not be the first impression.
2. **Make mobile feel designed for mobile.** The narrow layout stacks a tall scene, title, stage controls, then the model selector; the captured viewport also showed a horizontal scrollbar. Review vertical balance and keep model, stages, and capture discoverable without making people hunt below the fold.
3. **Explain the controls once.** A short hint for rotate, zoom, and pan would help first-time visitors. Keep it dismissible or unobtrusive.
4. **Strengthen roster navigation as the collection grows.** Two entries are easy to scan; a longer roster will need search or filtering and a clearer selected state.
5. **Treat PNG capture as a sharing feature.** Confirm its result clearly, and make the saved image useful outside the app with clean framing, the model name, and optional collection branding.

These are priorities, not an implementation spec. The site was not verified across device sizes or browsers.

## CEO review sections

This review was requested as product advice rather than a review of a specific implementation plan.

1. **Architecture:** The local-first, static setup fits a low-cost prototype and avoids an account requirement. Keep it while learning whether collectors return and share. Before hosting collections, define visibility, removal, and unavailable-asset behavior.
2. **Errors and recovery:** A slow model load can look like a stall. Show progress and a clear failure state with retry. The collection should explain itself if its data or model file cannot load.
3. **Security and trust:** There is no account or backend today. Hosting collections changes the privacy promise; make sharing visibility explicit and avoid implying private storage unless it exists.
4. **Data and interactions:** Preserve useful empty, loading, and error states as the collection grows. Decide whether reopening restores the last model and stage or starts from a clean default. Avoid losing a chosen view unexpectedly.
5. **Code and product complexity:** Resist adding features just because the 3D scene makes them possible. Prioritize browsing, curation, and sharing over animations, combat, or a sprawling editor unless users demonstrate that need.
6. **Testing:** Project docs describe coverage for model selection, stages, capture, and narrow layout. Add explicit checks for first visit, slow and failed model loading, larger rosters, and mobile capture as those flows evolve.
7. **Observability:** There is no analytics today. First gather lightweight, privacy-conscious signals that answer whether visitors select a model, switch stages, capture an image, or return. Avoid tracking for its own sake.
8. **Data and state:** Collection and stage data are static files; the selected view resets on refresh. That is a reasonable prototype constraint. Persisting a user’s collection or view is a separate product decision.
9. **API:** No backend API exists today. Keep it that way until there is a validated need for hosted collections, sync, or collaboration.
10. **Performance:** 3D assets and rendering are likely pressure points as collections grow and on mobile hardware. Track load time and asset size, and consider lazy loading models that are not selected.
11. **Design and UX:** The supplied desktop frame has strong visual hierarchy around the model. On mobile, the empty first state and control stack need attention; check keyboard focus, touch target sizes, contrast over busy scenes, and reduced-motion behavior.

## Next milestone

Improve the first session, then learn whether people want to curate and share. Potential measures are successful model load, model selection, stage changes, capture completion, and return visits—only if that instrumentation fits the product’s privacy promise.

The strategic risk is building a beautiful renderer that people visit once. The opportunity is making it the easiest place for collectors to present a collection they are proud to share.

## CEO review summary

- **Mode:** Selective expansion, adapted to a product review.
- **Strongest challenges:** Empty first impression; mobile layout friction; unclear evidence yet that visitors need a broader platform.
- **Recommended path:** Improve first-visit and mobile usability, then validate curation and sharing before adding accounts or cloud storage.
- **Accepted direction:** Keep the 3D showcase as the core and explore a shareable collection experience.
- **Deferred:** Hosted accounts, sync, and collaboration until users demonstrate demand.
- **Not in scope:** Treating more scene effects or features as success without evidence they improve repeat use or sharing.
