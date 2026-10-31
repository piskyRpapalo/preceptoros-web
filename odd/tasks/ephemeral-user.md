# ephemeral-user

Date: 2026-10-31
Law: Sovereign commission «EL USUARIO EFÍMERO» (Mesa web, carril claude, 2026-10-31): phases (1) functional ephemeral account, (2) army and gacha, (3) conquerable NPC buildings; phase «army de nodo» is not started. Plan first, no code before its FIRMA. Decree of the short tutorial route: ruta corta beelink + cabaña, Doggee out. Frozen heads re-evaluated after the pull to main `e466fe4`.

## Objective

A visitor with no node can play on the single map at `/openworld/`: a session account that lives in the page, a visit with copper and eggs, a practice battle, a conquest kept on this device, and a short tutorial walk. Nothing is saved to a node, and nothing is signed for value.

## Problem and why

Most of the play loop already exists on `main`, as separate pieces merged under JN-1 to JN-4 and the tutorial G4. What is missing is one honest pass through the whole loop, a short route that matches the Sovereign's decision, the replay controls the battle lacks, and the phase-2 and phase-3 wiring. This document measures what exists, names the gaps, and proposes the pieces. It does not change code.

## Scope

In scope, as pieces EU-1 to EU-6 below. Phase 1 is EU-1 and EU-2. Phase 2 is EU-3 and EU-4. Phase 3 is EU-5. EU-6 is the seal and gates that each piece carries.

Out of scope: a node account or any write to a node; a signed heartbeat; the army of a node (phase 2 of the commission, not started); any value, price or payment; the apps (beelink, doggee).

## Inventory measured today (main `e466fe4`)

Each row is what the code does, with its file and size. Sizes are the served files.

| part | file (size) | what it does now | status |
|---|---|---|---|
| visit account | `public/game/visitor_account.js` (3,025 B) | Consent required. Ed25519 key pair generated in the browser, not extractable, kept in page memory. Seed is SHA-256 of the public key. The visit ends with the page. | functional; browser check passes alone (3/3) |
| visit panel | `public/game/visitor_play.js` (3,425 B), id `visitor-play` on `/openworld/` | «Play without a node» panel. Only adopted troops are kept, and only for this device. | served on `/openworld/` |
| copper and eggs | `public/game/visitor_eggs.js` (3,068 B) | Beacon gives 100 copper once per visit. Eggs wait for a number of steps (`TCS[tc].incuba`). Hatch needs the egg ready. | browser check passes (`fallos []`) |
| practice battle | `public/game/visitor_battle.js` (3,510 B) and `visitor_battle_ui.js` (3,353 B) | Six patrols (Reef, Kelp, Ruins, Silt, Abyss, Core) from `AtlasValores.patrullas`. Historical ticks (`historical-ticks/1`). Replay is checked with `verify`. | functional; **no replay controls** (no pause, no speed) |
| conquest | `public/game/visitor_conquest.js` (3,843 B) | Winning a NPC place keeps it conquered on this device, with a clearing radius of 200. Wall-clock date is NO_DATA. List `ul#visitor-conquests`. | functional; browser check passes alone |
| gacha | `public/game/gacha.js` (6,005 B) | Deterministic from a 64-hex seed: four rarities, seven stats, Fourier-style harmonics. | on main; **not seen in the visit flow** (to be confirmed in EU-4) |
| walker | `public/game/colony_controls.js` (10,085 B), `colonia_pagina.js` | Ephemeral walker in memory. Its seal is NO_DATA (not node state). | on main (TA-1 to TA-5) |
| tutorial walk | `public/game/tutorial_walk.js` (2,455 B) | Six steps: key (cabin), beacon (beelink), egg (doggee-a), hatch (doggee-a), fight (doggee-b), node (cabin). Skip is recorded as skipped. | on main; **the Doggee steps are still in the walk** |
| crab | `public/game/gdpr-art25-ephemeral-crab.js` (4,613 B) | Crab that walks the bed of the visitor's house. No identity. | on main |
| wave look | `public/game/wave_render.js` (10,858 B), `wave_duel_scene.js` (16,200 B) | Wave figures and duel scene. | on main |

Tests measured in this pass (worktree of `origin/main`, no code changed):

- `tests/visitor_*.test.mjs` (4 files, 6 tests): 6/6 when run alone; 6/6 on one pass, then 1 failure in the next 6 combined runs. The failing test is `Chromium visit signature verifies independently through OpenSSL`, which runs `atlas/visitor_account_browser.mjs`. Run alone, that browser check passed 3 of 3.
- `atlas/visitor_eggs_browser.mjs`: `fallos []`.
- `atlas/puros/tutorial_walk_casos.mjs` and `atlas/puros/colony_controls_casos.mjs`: 20/20.

## What the internal reference adds (adapted, never copied)

The commission asks for the strong pieces of the quarantined game to be adapted to today's distribution, with source and date. The quarantined game is an internal reference. Its name and its files are not in this document or in any public receipt. Source: the quarantined prototype's combat and gacha modules, snapshot of 2026-10.

| piece from the reference | taken as | where it is now on main | status |
|---|---|---|---|
| wave figures: damage as detuning, speed as colour, additive glow | visual idea only | `wave_render.js`, `wave_duel_scene.js` | adapted, DONE |
| deterministic replay with play and pause, speed ×1 ×2 ×4, timeline | the controls and the timeline; the replay stays driven by the verified record | not on main | **gap**: EU-3 |
| gacha by seed with harmonics | the seeded draw, with SHA-256 instead of its own hash | `gacha.js` | adapted, DONE |
| egg timing and copper | the cycle rule only | `visitor_eggs.js` | adapted, DONE |

No name, figure or crew design from the reference later than 2026-09-16 is used. Public text is English.

## Gaps for the ephemeral account

- **G-a**: no single browser pass covers one visit from start to end: consent, egg, battle, conquest, leave. The four checks run apart.
- **G-b**: the browser check of the visit account is flaky when the four visit tests run in parallel (1 in 6 combined runs). It is not flaky alone.
- **G-c**: the battle has no replay controls (EU-3).
- **G-d**: gacha is not seen in the visit flow (EU-4, to be confirmed).
- **G-e**: the tutorial walk still has the Doggee steps. The decided short route is beelink plus cabin.
- **G-f**: copper has no sink. Balance is NO_DATA until it is measured.
- **G-g**: NPC places are listed, not drawn as buildings on the map (EU-5).

## Decisions (declared, inside the commission's cage)

- **D1 · Identities stay apart.** The walker, the visit key and any node identity have separate meanings (JN-1). Nothing links them.
- **D2 · No value signing.** The visit key is an Ed25519 pair made in the page, not extractable, in page memory only. It signs visit records, never value. No network on the visit path.
- **D3 · Copper and light live inside one visit.** They have no price and cannot be sold or moved. Balance is NO_DATA until a measured value exists.
- **D4 · Short route is beelink plus cabin.** The walk becomes key (cabin), beacon (beelink), node (cabin). The Doggee steps leave the walk; their code stays for later phases. Beelink is NO_DATA until its heartbeat, so the beacon step stays unplayable until then. The tramo must still be playable without Beelink (commission binding), so a NO_DATA step can be recorded as skipped, never as played (D19 of the walk). **This choice is flagged for the Mesa.**
- **D5 · Tools: decided and declared.** The Tools control always opens the device list. Installing the app becomes its own control, shown only when the browser has offered the install. This is not built here: it is its own piece after its FIRMA, because `public/assets/intro.js` is a door and the change needs its own gates.
- **D6 · Replay controls adapt the reference's timeline, not its records.** The record stays the verified one (`historical-ticks/1`). A controls change cannot change a result.

## Checklist (one piece = one PR; FIRMO per piece before code)

- [ ] EU-0 · this plan. FIRMA of the Sovereign required before any piece.
- [ ] EU-1 · one browser pass for one visit: consent, egg, battle, conquest, leave, records read-only after leaving. Also fix G-b: run the visit browser checks one at a time (`--test-concurrency=1`) or give each its own port. Phase 1.
- [ ] EU-2 · short route: STEPS become key, beacon, node; Doggee steps out of the walk; the NO_DATA beacon can be recorded as skipped. Pure cases with sabotage (a step played on a NO_DATA place is refused). Phase 1.
- [ ] EU-3 · battle replay controls (play, pause, ×1 ×2 ×4, timeline) over the verified record. Pure cases; sabotage: a speed change that alters the result is refused. Contact sheet. Phase 2.
- [ ] EU-4 · gacha pull inside the visit with copper as the only cost; balance NO_DATA. Confirm first where the pull is (G-d). Pure cases twice. Phase 2.
- [ ] EU-5 · NPC places drawn as buildings on the single map; conquest changes the frame with its sentence and seal LOCAL · practice. Frames under 1,024 B. Contact sheet. Phase 3.
- [ ] EU-6 · gates per piece: `atlas/lexicon_gate.mjs`, `atlas/version_sw_gate.mjs --base origin/main`, `atlas/colonia_pagina_gate.mjs`, `atlas/openworld_browser.mjs` (fallos []), seal chain in the same commit, door ≤ 16 KiB.

## Verification evidence

- Measured here: the visit test files and their pass and fail counts above; the browser check for eggs; the tutorial and colony pure cases (20/20).
- Measured by reading: the file list and sizes in the inventory; the steps of the walk (`tutorial_walk.js` lines 9 to 16); the replay controls are absent (no pause or speed match in the visit battle files).
- Frozen heads re-evaluated after the pull to `e466fe4`:
  - `fcc23ca` (G4-2 tutorial walk serve): merged in `main` through #433. Nothing live is left in that head.
  - `4b2937b` (accessibility back and close): its content is on `main` through #436 (`public/assets/intro.js` and `public/index.html` identical). Nothing live is left, except the seal files, which `main` regenerated.
  - `28c96f5` (G5 combat plan): merged through #435. Its core, W1, is merged through #437. The plan's W2 to W4 are still open.
- Not measured: a real phone pass of the visit; any balance value.
- NO_DATA: copper and gacha balance; Beelink's heartbeat, which is the Sovereign's.

## Standing signature

Required: FIRMA of this plan (EU-0) before EU-1. FIRMA per PR. D4 (the short route) needs the Sovereign's FIRMA as a layout choice; the Mesa has been asked. D5 needs its own FIRMA when built.

## Methodology relief

None.

## Log

- 2026-10-31 · Pulled main to `e466fe4`. Re-evaluated the three frozen heads: all three merged, one of them partly superseded. Measured the visit account tests and the eggs browser check. Found one intermittent failure under parallel runs.
- 2026-10-31 · Plan written. No code moved. The short route and the Tools control are declared as decisions D4 and D5.

## Next step

The Sovereign's FIRMA of this plan (EU-0). Then EU-1, the one-visit browser pass and the flaky-check fix, as its own PR.
