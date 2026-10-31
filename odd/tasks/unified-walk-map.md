# unified-walk-map

Date: 2026-10-31
Law: Sovereign decree «eso de north, west… no sé qué es y debería eliminarse. Debería ser un camino unificado, como el mapa de un juego de Pokémon» (2026-10-31); Mesa commission «MAPA ÚNICO REAL» (2026-10-31) and its contract `docs/SPEC_MAPA_JUGABLE.md` on branch `mistral/spec-mapa-jugable-20261031` at `f5ad60e5` (read in full). Plan first, FIRMA before code, one PR, on `main` `3658a6d`. D5 (Tools) waits in queue.

## Objective

The visitor walks on the map. The avatar stands on its hex on the canvas, a click or tap on a neighbouring node walks it there, and arriving is entering. The six-direction grid goes away. Keyboard arrows stay, for accessibility.

## Problem and why

The map is drawn, but its only way to move is a grid of six compass buttons (`#joy`) and an «enter node» button, both built by `colony_controls.js` `mount()`. The decree says this is not a playable map. Measured on `main` `3658a6d`: the grid is in `public/openworld/index.html` line 63 (`<div id="joy">`), built in `public/game/colony_controls.js`; `move()`, `enter()`, `colours()` and `savedChoice()` are the pure laws behind it, and they stay.

## Scope

In scope:

1. A pure route module (`walk_route.js`): the path from the walker's node to a target node over visible nodes (seal LIVE or STALE), offline and tested.
2. The avatar drawn on the canvas on its hex, with a step animation between hexes and a reduced-motion path that arrives in one step.
3. Click or tap on a neighbouring visible node: the avatar walks the route. Arrival calls the existing `enter` and `tutorial_walk.advance()`.
4. Removal of the `#joy` grid and the «enter node» button. Keyboard: arrows move a visible selection among neighbours and Enter walks there; the status line is a live region.
5. Gates and tests that asserted the grid are updated, and only those (see the list below).

Out of scope: `move()`, `enter()`, `colours()`, `savedChoice()`, `tutorial_walk.js` (unchanged); the schema v2 (`openworld_state.js`, `colony_state.js`, `world_feed.js`): zero change; the chat (seal `aw`); units; buildings; any external reference beyond the adaptation the Mesa named.

## Decisions (declared)

- **W-D1 · Walkable = visible nodes only.** A hex can be walked only if it holds a visible node (LIVE or STALE), as `move()` does today. The road is drawn between adjacent visible nodes. No other hex is walkable, so a hex without a node is never on a route.
- **W-D2 · One visible node is one hex.** In production today only `cabin` is visible (`public/openworld/estado.json`: beelink NO_DATA, doggee-a and doggee-b NO_DATA). So the unified road is one hex until other nodes are LIVE or STALE. That is the honest state, and it is stated on the map, not drawn as a longer road. The short route's beacon (Beelink) stays skipped (EU-1).
- **W-D3 · No clock in the render path.** The step animation counts frames, not milliseconds: a fixed number of frames per hex, and zero frames with reduced motion. The route and the step index are integers. No `Date`, no random number.
- **W-D4 · Arrow keys stay.** They choose a visible neighbour in that direction (through `move()`), and Enter walks to the selected one. Every arrow press is announced through the status line.
- **W-D5 · Gates that asserted the grid change, the rest stay.** `atlas/colonia_pagina_gate.mjs` (asserts six buttons and «enter node» in the door), `atlas/openworld_browser.mjs` (asserts `#joy` buttons 8, touch sizes and «enter node»), and the browser checks that press «enter node» (`atlas/tutorial_walk_browser.mjs`, `atlas/usuario_efimero_pasada_browser.mjs`) are rewritten to walk by clicking the cabin hex. Their other assertions are kept. This needs the Mesa's OK, because the commission asks for the battery to stay whole.

## Constraints

- Frames stay under 1,024 B; the door stays under 16 KiB; no network on load; no random number, no clock in the render path (W-D3).
- Reduced motion: the arrival in one step.
- Accessibility: arrows and Enter reach everything; buttons at least 44 px; colour plus text on the road.
- Walker stays ephemeral per visit; the terminal choice in `localStorage` stays.
- Seal: the next free letter, `ay` at measurement (`aw` for the chat, `ax` for battle controls, `av` for the single visit pass). The Mesa's note saying `ax` is stale: `ax` is already used.

## Checklist (one piece = one PR; FIRMO before code)

- [ ] W-1 · this plan. FIRMA required before W-2.
- [ ] W-2 · pure route module `atlas/puros/walk_route.js` (+ served copy) and cases offline: adjacent step, two-hop route, unreachable target NO_DATA, a hex without a node refused, a NO_DATA node never on a route. Sabotage: a route through a non-node hex is refused.
- [ ] W-3 · the avatar on the canvas (`public/game/colonia_pagina.js` and the door), the click and tap hit test, the frame-counted walk, arrival = `enter` + `advance`.
- [ ] W-4 · remove `#joy` and «enter node»; arrows with the status live region; reduced-motion path.
- [ ] W-5 · the gates in W-D5 updated; full battery run; seal chain with the next free letter; receipt with the exact head, the `npm test` output (if the repo has it; otherwise the commands run), and one sentence on the movement.

## Verification evidence

Measured on `main` `3658a6d`: the grid and its button ids; the gates that assert it (`atlas/colonia_pagina_gate.mjs` line 87 to 88, `atlas/openworld_browser.mjs` lines 65 to 107); the only visible node in `public/openworld/estado.json`. The spec's «npm test» is not a script in this repo (no `package.json` test script measured); the repo runs `node --test` for pure cases and `python3 test_web.py` for the battery. Not measured yet: any browser run of the new walk (W-3 and W-4).

## Standing signature

Required: FIRMA of this plan before W-2. FIRMA per PR after that. The Mesa's decision on W-D5 before W-4.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan written from the decree, the spec on `f5ad60e5`, and `main` `3658a6d`. No code moved. W-D2 and W-D5 flagged for the Mesa.

## Next step

FIRMA of this plan (W-1), then W-2. The Mesa's answer on W-D5 before W-4.
