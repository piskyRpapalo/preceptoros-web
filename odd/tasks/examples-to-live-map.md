# examples-to-live-map

Date: 2026-10-31
Law: the Sovereign, 2026-10-31: «son 3 semanas de cambios mal enviados a "ejemplos" y no al mapa real y único» and «Firmo. continúa!». Decrees ·6524386655 (one map), ·6524440790 (the web is the only reality), ·6524501049 (the whole truth reaches the map).

## Objective

Every game change that landed only under `docs/rebuild/examples/` reaches the single map on preceptoros.org (`public/`), or is recorded with its status. The examples are harnesses and history, not the product.

## Problem and why

Measured on `origin/main` (bf6516c): 12 commits from `183f2dd` to `63c8331` touched only `docs/rebuild/examples/` (`public=0`), and the four duplicated pages (`basic`, `atlantis`, `zombie`, `index`) no longer match `public/face/`. The gameplay of those commits (joystick, chat under the map, narration, zoom, combat of waves, the crab, the tutorial walk) is not on the map.

## Mapping (each row: what it is, where it belongs, status)

| commit | change (subject) | belongs to | status on the live map |
|---|---|---|---|
| 63c8331 | one-shot terrain harnesses, launcher, validator, runbook | tools (test) | not on the map; keep as harness |
| 2cf5052 | one-shot registry, parity with the app, eye tools | tools (test) | not on the map |
| 5d4b5f1 | one face (chat + joystick) in three skins over one geometry | G1 and G3 | joystick and chat under the map: built on `haiku/ic7-terminal-anchor-20261031` (`e3c46cb`), awaiting merge |
| 183f2dd | icon views, chat always at the bottom, Army canon, gacha | G3 (chat under the map) | chat under the map: built (same branch); icon views: plan |
| 5b4cb71 | joystick and icons inside the map, chat under the map, no bust | G1 and G3 | same as 5d4b5f1 |
| 5174cd4 | living isometric map as background and one fixed window with no scroll | the single map | colony on the map: DONE (IC6 and after). **Conflict**: the `#map` section scrolls in the terminal branch (`overflow:auto`, decision for the phone); the decree asks for one fixed window. To be decided by the Sovereign |
| 0af14d9 | three layouts over the living map, the tutorial walk | G4 | plan (`game-pieces.md`), not built |
| 3b166c8 | category panel, canon worm, wave combat, zoom keeps size | G2 and G5 | plan; the crab's action panel is the target (ideas13oct sec. 24) |
| 70c0464 | character: the wandering zombie, canon creatures in Atlantis | G6 and the colony bots | plan; the zombie look exists (IC7-S4) |
| 1811f77 | narration visible at 256 px, zoom tests, canon sea background | the frase list (DONE) and the sky (DONE) | frases visible and per-tick: DONE on main (`#418`) |
| f19b4b0 | speaker and radio that read the screen, the guide phrase becomes voice | F5 (radios) and the sound of frames | plan (`main-map-single.md`, F5); NO_DATA until the rack transmits |
| 183f2dd | (see above) | | |
| 9e3323f | launcher titled «three proposals» | test page | test label only (MM-1 on branch `aca`/`acb`) |
| 394e992 | tutorials: Neutral mandatory, guided steps, eggs by cycles | G4 | partly in `public/` (22 files already touched by this commit); the rest is plan |

## Conflicts to decide (not decided here)

- **Fixed window without scroll** (5174cd4) against **the phone layout that scrolls the map** (terminal branch). Proposal: keep the phone scroll only below 360 px; the Sovereign decides.
- **Sound** (f19b4b0): the radio reads the screen. The sound rule is synthetic and local; a reader that speaks the screen needs its own FIRMO.

## Checklist

- [ ] EX-1 · the terminal branch merges (joystick, chat under the map): covers 5d4b5f1, 5b4cb71 and part of 183f2dd.
- [ ] EX-2 · the tutorial walk (0af14d9, 394e992): G4.
- [ ] EX-3 · the crab panel and waves combat (3b166c8): G2 extension and G5.
- [ ] EX-4 · the zombie wanderer and canon creatures (70c0464): G6.
- [ ] EX-5 · radios that read the screen (f19b4b0): F5, after the sound FIRMO.
- [ ] EX-6 · the fixed-window decision (5174cd4): Sovereign's call.

## Verification evidence

Measured: the twelve commits and `public=0` each (git show --name-only); the four duplicated pages differ from `public/face/` (cmp). Not measured: whether the examples' gameplay code works on the live map (no run here).

## Standing signature

Required: FIRMO of this plan (given: «Firmo. continúa!»), FIRMO per PR, FIRMO for the fixed-window decision and for the radio sound.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan written from the git history of `origin/main`; no code moved. The examples stay as they are.

## Next step

EX-1: the terminal branch goes through the Mesa's PR and FIRMO. Then EX-2.
