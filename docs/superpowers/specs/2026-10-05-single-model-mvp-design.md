# Single Model MVP

Approved in chat on 2026-10-05.

## Requirements and scope
Remove the Deployment section and Alpha/Bravo/Charlie slot selection. Keep the roster selecting exactly one hero, all stages, camera controls, loading/error states, and PNG capture. Remove unused slot state, actions, props, and CSS. Update README and empty-state wording to describe viewing one model at a time. Historical design documents remain historical.

## Approach, interfaces, and data flow
CommandSheet receives model and stage selections only. App dispatches select-unit and select-stage through the existing reducer. Remove selectedSlotId and select-slot from TacticalState/TacticalAction. Selecting another unit replaces selectedUnitId and increments loadRequestId; stale completion events remain ignored. Keep the existing responsive roster/stage layout, with stages filling the controls column on mobile.

## Failure behavior
Existing collection/stage fetch fallbacks, model errors, and capture failures remain unchanged. No new resources or asynchronous operations.

## Acceptance and tests
Deployment controls are absent on desktop/mobile before and after model selection. Unit replacement retains one selected model and current stage. Haro visibly renders in all stages and capture works. Update reducer/component/browser tests, first observing failing removal assertions. Run type-check, full unit tests, build, Playwright, then visible Playwright MCP verification with Haro and desktop/mobile screenshots and console checks. Review working-tree diff before completion. Do not commit.
