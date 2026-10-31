# integration-stack

Date: 2026-10-31
Law: the Sovereign, 2026-10-31 («tenemos todas las piezas. comienza a atarlas»); decree ·6524501049 (the whole truth reaches the single map); decree ·6524440790 (the web is the only reality); the rule that a cited head that is dead means a dead signature (Mesa, 2026-10-30).

## Objective

One ordered stack that ties the pieces of the single map, with the exact head of each piece, what is merged, what waits for the rack, and what waits for a signature. Nothing is merged here.

## State measured (read-only, 2026-10-31)

| piece | where | head | state |
|---|---|---|---|
| main | `origin/main` | 256f1a4 | IC7 terminal (#423) and examples plan (#424) merged; VERSION abz in production |
| terminal, joystick, chat under the map | #423 | merged | in main |
| examples to live map (plan) | #424 | merged | in main |
| MM-1 + producer of state v2 + judge cure | #422 `haiku/mvp-moderno-web-20261031` | remote 8117c348 (old); local cure b3d41b9 | DIRTY; the cure must be pushed by the rack; then FIRMA v2 and FIRMO |
| producer of state v2 (separate branch) | `haiku/mm2-productor-estado-v2-20261031` | remote 98159104 | redundant: its commit is inside #422; to be closed, not merged twice |
| G4 tutorial as a walk (plan) | `haiku/g4-tutorial-walk-plan-20261031` | remote bb016e1 | plan only; based on an older main; rebase when its turn comes |
| MVP visual and audio (plan) | `haiku/map-visual-audio-plan-20261031` | remote b7592d6 | plan with MV-D1 and MV-D2 decided; waits for FIRMO |
| T1 tools page | `haiku/t1-tools-page-20261031` | not pushed | blocked by the eight-page cap; amendment needed |

## The stack (order)

1. **#422 · MM-1 + state v2 producer** — the cure b3d41b9 pushed by the rack, then the Mesa's FIRMA v2 on that head, then FIRMO. It carries the producer, the compact state (595 B, one line) and the browser judge at the declared state.
2. **Close the separate producer branch** (98159104): its content is in step 1.
3. **G4 tutorial walk** — after step 1; rebase onto the new main; its own FIRMO per piece.
4. **MVP visual and audio** — after the plan's FIRMO; its pieces follow the ladder of `map-visual-audio-mvp.md`.
5. **T1 tools page** — only after the Sovereign amends the eight-page cap, or chooses another place.

## Gates the stack must pass at each step

- `python3 test_web.py`, `python3 atlas/test_atlas.py`, `node arnes_sw.mjs`, `node atlas/version_sw_gate.mjs`, `node atlas/lexicon_gate.mjs`.
- `node atlas/openworld_browser.mjs` at the declared state (cabin LIVE; Beelink and Doggee NO_DATA).
- The seal chain in order: measures, then the seal at the end, with a fixed VERSION.
- SCRUB: no machine paths, no users, no credentials, and the vetoed word absent.

## Blockers (declared)

- The push of the cure b3d41b9 belongs to the rack (code). It is the only step that stops the stack.
- The Mesa's signature on the new head (the cited head must be alive).
- Beelink and Doggee are NO_DATA until there is a dated, fresh measurement. Their LIVE state is not forced.
- Benchmarks and lab data have no receipt route yet (aduana D4, not deployed).

## Standing signature

Required: the Sovereign's signature per head, and FIRMO per PR. This document is text only and is covered by the standing ODD rule for documents.

## Methodology relief

None.

## Log

- 2026-10-31 · Stack measured and written. Nothing merged, nothing pushed except this document.

## Next step

The rack pushes b3d41b9 onto #422; the Mesa signs its new head; then the separate producer branch is closed.
