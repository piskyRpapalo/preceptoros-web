# One map · inventory of node content (2026-10-28)

Node content that must survive the replacement of the map. Nothing here is deleted by this piece.

| Piece | File | Bytes (measured) | Role | Wire to |
|---|---|---|---|---|
| Zombie world | `public/face/zombie.html` | 13,627 raw · live `/face/zombie` 13,627 | The Risen (zombie) world page | IC3 catalogue: the Risen |
| Atlantis world | `public/face/atlantis.html` | 13,394 raw · live 13,394 | Node Hexelion (Atlantis) world page | IC3 catalogue: Node Hexelion |
| Tutorial world | `public/face/basic.html` | 13,283 raw · live 13,283 | Basic tutorial world page | IC3 catalogue: the tutorial cabin |
| Worlds hub | `public/face/index.html` | 2,084 | Lists worlds that are live; today "No node is live" | Stays; points to the one map |
| Face scripts | `public/face/face*.js`, `face*.css` | see `git ls-files public/face` | Shared engine for the world pages | Keep until the catalogue reads them |

Reconciliation: the Sovereign measured `zombie.html` at **10,488 B on the live web**. Measured here: 13,627 B raw and 13,627 B over the wire (`curl -L`), identical to the file in the repo. The 10,488 figure is **NO_DATA** until its source is known (a different page, a different measure, or an older build).

Catalogue rule (IC3, decree 6470048349): each piece becomes a catalogue entry with its lexicon key. A piece without a key is an `orphan_visual_node` and is refused. No piece is removed while the map is replaced.

## Current map pointers and measured addition · 2026-10-30

The single served map is [`/openworld/`](../public/openworld/index.html). Its state is [`estado.json`](../public/openworld/estado.json); the renderer reads that state and exposes the joystick on the same page. The production joystick walk is recorded in [`docs/evidence/openworld-walk-20261030.md`](evidence/openworld-walk-20261030.md), including its capture time and the empty-node refusal. That snapshot is historical, not a claim about a later deploy. These pointers identify the implemented pieces without creating a second map or a second source of state.

| Map piece | Web entry point | State and evidence |
|---|---|---|
| Joystick and terminal choice | [`public/game/colony_controls.js`](../public/game/colony_controls.js), mounted by [`public/openworld/index.html`](../public/openworld/index.html) | [`atlas/puros/colony_controls_casos.mjs`](../atlas/puros/colony_controls_casos.mjs) and the [production walk receipt](evidence/openworld-walk-20261030.md). The walker is memory-only; the selected terminal look may be saved separately in this browser. |
| Ephemeral map walker | [`public/game/colonia_pagina.js`](../public/game/colonia_pagina.js) | `youFrame` labels the walker `NO_DATA` and “not node state”; cases: [`atlas/puros/colonia_pagina_casos.mjs`](../atlas/puros/colonia_pagina_casos.mjs). |
| Anonymous tutorial entry / ephemeral player crab | The tutorial walk on the one map (`/openworld/`, the cabin) · [`public/game/gdpr-art25-ephemeral-crab.js`](../public/game/gdpr-art25-ephemeral-crab.js) | [`atlas/gdpr-art25-ephemeral-crab_casos.mjs`](../atlas/gdpr-art25-ephemeral-crab_casos.mjs). The preserved decree says play for ten minutes without creating an account (`NORTE5_LISTA_CONSERVACION.md`, P6). [`public/face/basic.html`](../public/face/basic.html) remains a preserved pre-decree world page (deep links, app#115); since 2026-10-30 the one map no longer links it as the tutorial entry. The optional browser identity is separate and persisted by [`public/assets/auth.js`](../public/assets/auth.js); it is not the ephemeral walker. |
| HEXELION model benchmark | [`/openworld/hexelion-benchmark.json`](../public/openworld/hexelion-benchmark.json), published with the map | Three local `eval rate` readings from 2026-10-30; source receipt hash and command family travel with the data. This historical benchmark does not establish a live heartbeat or add a node to `estado.json`. Since 2026-10-30 the one map no longer links it; the record stays published at its URL and in this inventory. |

This addendum points to the current map and its existing visitor controls. It does not alter the map's node inventory or turn an unbound node into a live one.

## One-map repair · 2026-10-30 (second piece)

The one-map decree says OpenWorld is the sole map. Pointers added on 2026-10-30 (`Benchmark data` and `Tutorial · no key`, the latter leading to the pre-decree tutorial world page `/face/basic.html`, which draws its own map from its own state) took additions onto the one map page. Repair, ordered by the Sovereign: both links are removed; `map_pointers.no_identity_tutorial_entry` now names `/openworld/`; the benchmark record stays published at its URL. The pre-existing `Army fixture` link stays; its defect (a synthetic army face with its own joystick over its own map, no user profile sha, no ephemeral crab) is handed to the panels commission. The preserved world pages stay on disk as deep links (app#115) until the measured redirect rule and the Worlds door exist. Receipt: [`receipts/one-map-links-20261030.md`](receipts/one-map-links-20261030.md).
