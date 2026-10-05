# Shaded Stage Surfaces

Approved in chat on 2026-10-05.

## Requirements and scope
Give Hangar painted floor markings and Ruined City solid surfaces lighting-responsive shading similar to Forest. Preserve geometry, camera profiles, shared lights, hero materials, stage metadata, controls, and capture. No PNG maps or new assets.

## Approach and interfaces
Keep Hangar's existing standard steel materials. Change yellow painted markings to rough nonmetallic meshStandardMaterial. Change city road, sidewalks, building bodies, roof caps, divider, curbs, and deployment-pad base to rough standard materials. Preserve existing color, opacity, and geometry. Keep scan rings, deployment-pad luminous accents, lane indicators, windows, and Hangar light strips basic/emissive-looking materials.

## Data flow and failure behavior
Existing stage selection dispatches the same backdrops, whose solid surfaces respond to the existing ambient and directional lights. No interfaces or asynchronous loading change. Existing stage/model failure handling remains applicable. PNG capture includes the shaded canvas as usual.

## Acceptance and tests
Hangar painted markings and city solid surfaces respond to light; bright accents remain readable. Haro remains fully framed. All three selectable stages, switching, orbit controls, and PNG capture remain functional. Verify material assignments with a failing regression test before implementation, then run type-check, unit tests, build, and Playwright. Use Playwright MCP to select Haro, switch stages, inspect rendering and console errors, and capture Hangar and Ruined City screenshots.

## Review
Scope, interfaces, failure behavior, and acceptance coverage reviewed. Leave this document and the plan uncommitted as required by AGENTS.md.
