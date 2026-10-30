# live-colony-nodes

Date: 2026-10-30
Law: buzon#30 decrees ·6521940119 (everything visible on the live web; real nodes shown with their own look; method = search odd/ and main history, measure nothing new), ·6522187525 and ·6522243791 (look as in the tutorial; terminals belong to the user and change colour with the node; the map is the colony of bots; IC7 composes IC1–IC6 plus terminals plus liveness), ·6522331337 (inside the cage the author decides and declares; the Sovereign governs only with FIRMO).

## Objective

On the live web at `/openworld/`, the global map is the isometric hex colony of IC1–IC6. Each node the state declares alive appears as a bot with a face on its hex, with its own look, and its building. Nothing that is not declared alive is drawn.

## Problem and why

IC6 draws the colony, but the state file lists no nodes (`public/openworld/estado.json` = `{ nodes: [] }`), so a visitor sees only the tutorial cabin. The real nodes (Beelink, the Android device Doggee) never appear on the map. Search result (IC7-S1, measured on main `3b93e68`):

- No file in main writes `estado.json`. Its only references are the page, the test that checks it, and the history docs.
- The canon says the opposite of the decree on one point: `docs/canon-nodes-and-npc.md` line 9 and `docs/canon-node-evidence-and-account.md` line 7 state that a live rack heartbeat is unavailable to the page at load and remains `NO_DATA`; `public/game/cuenta.js` line 15 carries `latido: 'NO_DATA'`.
- A node is declared active from dated measured evidence in the account credential (canon), not from a heartbeat.

## Scope

In scope, in order (one piece, one PR each):

1. This document (IC7-S1 result and the decisions below).
2. Schema v2 of `estado.json` and its validation (IC7-S2).
3. Bots of the live nodes on the colony map (IC7-S3).
4. Doggee on two adjacent nodes (IC7-S4).
5. Terminal that follows the node (IC7-S5).
6. Empty state: the account's house and fog (IC7-S6).
7. Gates, seal, captures (IC7-S7 to IC7-S9).

Out of scope: a heartbeat producer that sends data to the network (needs its own FIRMO and a canon amendment), any new world, any measurement not already in the repo, and any system service or unit (sudo and root are available, but no system action is part of this work).

## Constraints

- Status labels per node and per datum: LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR. A datum without a label is not shown.
- 16 KiB per file; frame under 1,024 UTF-8 bytes; no network request on load; sound only synthetic and local.
- Live web only: everything shown is what `/openworld/` serves on Cloudflare.
- Legal: neither the name of the 3D reference nor crew designs posterior to 2026-09-16 are used. Colony bots are our own design.
- Quarantine (Atlas decree): nothing from the old map is referenced or served.
- `public/openworld/index.html` is at 13,797 B of a 16,384 B ceiling: the render lives in a module under `public/game/`.
- `gate.yml` is not edited here; its lines are ordered by the Mesa.

## Checklist

- [x] IC7-S1 · Search of history: no heartbeat producer and no writer of `estado.json` in main; canon marks the heartbeat `NO_DATA` and not read at load (see Problem).
- [ ] IC7-S2 · Schema v2 for `estado.json`: nodes `{ id, q, r, vivo, sello, desde }`, buildings `{ id, node }`, validated by IC1; key `colonia` of IC6 kept.
- [ ] IC7-S3 · Bots with faces on the live nodes' hexes; Beelink/Hexelion on the centre hex with the Atlantis look; Doggee with the zombie look.
- [ ] IC7-S4 · Doggee on two adjacent nodes `doggee-a` and `doggee-b`, one building each (IC1 unchanged).
- [ ] IC7-S5 · Terminal (basic, atlantis, zombie) follows the node the user plays on; personalisation in the app is `NO_DATA` on the web.
- [ ] IC7-S6 · Empty state: the account's house (radius 360) and fog cells as `NO_DATA` ("cell not visited"); a cell lifts when a lane has stood on it.
- [ ] IC7-S7 · VERSION: next free letter after `abkt` (checked against open PRs) and the full seal chain in the same commit.
- [ ] IC7-S8 · Gates: pure cases (schema v2, IC1 refuses two buildings on one node, a stale datum becomes STALE, no random, no clock, no network), visual page with two identical runs, sabotages (a node without a lexicon key; a stale datum drawn as LIVE). `test_web.py` and `test_atlas.py` (`OPENWORLD_PAGE_DEPENDENCIES`) updated.
- [ ] IC7-S9 · Captures: draft before deploy (declared); definitive on Doggee against `preceptoros.org` after deploy, with `adb shell am start -a android.intent.action.VIEW -d https://preceptoros.org/openworld/` and `adb exec-out screencap -p`.

## Verification evidence

- IC7-S1 (measured, origin/main `3b93e68`): `git log -- public/openworld/estado.json` lists 2 commits (`e4dd827`, `174decb`), neither a writer; `git grep` for `estado.json` in `.github/`, `bin/`, `deploy/`, `tools/` returns nothing; `docs/canon-nodes-and-npc.md:9`, `docs/canon-node-evidence-and-account.md:7`, `public/game/cuenta.js:15` as quoted above.
- Live page (measured by the Sovereign on production, buzon#30 ·6521381629): `/openworld/` shows the cabin, `Nodes online: 0`, and `Colony: NO_DATA`.
- Doggee device (measured by the Sovereign): serial `S110000000000019878`, model `S110`.
- NO_DATA: the weakest-device motion; the Doggee personalisation in the app; a live producer of node data (none exists in the repo).

## Standing signature

Required: FIRMO for IC7-S2 (it changes the node contract the state file uses), FIRMO for IC7-S4 (it changes which node ids exist), and a separate FIRMO and canon amendment before any heartbeat that leaves the rack. Search done: `odd/`, main history, the canon documents named above. No other signature found in the corpus for this work.

## Methodology relief

The canon line "a live rack heartbeat ... remains NO_DATA" and the decree "only what the heartbeat declares alive is shown" cannot both hold on the page. Proposal, not applied here: amend the canon to say that node liveness is declared by dated measured evidence in `estado.json`, and that a heartbeat, when it exists, is a separate signed source. Until that is signed, IC7 reads only `estado.json`.

## Log

- 2026-10-30 · Plan approved (buzon#30 decrees above). IC7-S1 searched and recorded.
- 2026-10-30 · Decision D7 (declared): IC7 reads only `estado.json`. Its content must come from dated, measured evidence, the same source the canon already uses for node activity. A heartbeat is a separate piece with its own FIRMO. This keeps the canon intact while the decree's "real nodes appear" is served.
- 2026-10-30 · Decision D1: Doggee on two adjacent nodes `doggee-a`, `doggee-b` (IC1 intact).
- 2026-10-30 · Decision D2: Beelink/Hexelion on the centre hex (0,0); Doggee on axial neighbours; the cabin stays as the always-visible tutorial hex.
- 2026-10-30 · Decision D4: no animated appearance; a node that is no longer declared alive leaves the map on the next state, with no error panel. Reduced motion: no bot bobbing (IC6 behaviour).
- 2026-10-30 · Decision D5: English texts; node labels come from `estado.json`, never fixed in code.

## Next step

IC7-S2: schema v2 of `estado.json` and its validation, as a pure module under `atlas/puros/` with a copy in `public/game/` (the parity test of IC6 applies).
