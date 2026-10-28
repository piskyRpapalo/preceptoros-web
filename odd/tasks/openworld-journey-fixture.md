# OpenWorld first journey · fixture

PROPUESTA · REQUIERE_FIRMA. The commissioned MVP sequence is key → lighthouse → first fight, inside OpenWorld (app #134 manifest, item 25). At web main `bdd4005`, `public/openworld/index.html:89` starts the map with the cabin and an empty node array; `:140` filters two named nodes and `:219` reads a state file once. The inspected surface does not demonstrate the full first journey or a live node policy. This source audit does not prove no other implementation exists. Live node readiness, key ceremony, and combat outcome are NO_DATA without verified receipts.

Smallest slice: replay explicit synthetic observations through the ordered journey, with rejection and cause for out-of-order events. The model records that an observation was supplied; it does not verify a key, admit a node, sign, start a real battle, grant a reward, or create a real identity. No network, time, or random input. Production wiring requires the real key and combat contracts and measured node policy, in separate slices. Lawful default while these are missing: NO_DATA with cause.

Log · 2026-10-28: the exact key and fight receipt schemas are not established by the inspected paths. The fixture deliberately uses synthetic event names and is not a credential authority.

Receipt: `node atlas/fixtures/first_journey_cases.mjs` passes; replacing the first required observation with `fight_requested` makes it fail, and restoring the rule passes. Local gates: `test_web.py` 75 tests (one skipped), `atlas/test_atlas.py` 45, service-worker harness 24/24, seven atlas case scripts green. No visual surface changed; real browser journey remains NO_DATA.
