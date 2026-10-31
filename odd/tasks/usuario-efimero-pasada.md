# usuario-efimero-pasada

Date: 2026-10-31
Law: Mesa web comission «EU-1 · PIEZA 1 · PASADA ÚNICA DE VISITA» (2026-10-31): one visit from arriving at `/openworld/` to finishing the short route (cabin done, beacon recorded as skipped · NO_DATA), with the ephemeral account alive and the tutorial state coherent at the end. Decree on the short route: a visit counts as complete with the beacon step recorded as «saltado · NO_DATA», never as done, and it never blocks progression. Inventory in odd before code (this document). Plan `usuario-efimero.md` (EU-0) is merged.

## Objective

One browser pass, measured and repeatable, that goes from the arrival at `/openworld/` to the end of the short route with the visit account alive and the tutorial state coherent when the pass ends.

## Problem and why

The visit (`visitor_play`) and the tutorial walk (`tutorial_walk`, driven by `colony_controls`) are separate pieces with no link. Measured in this session: no visit module refers to the tutorial. The visit has its own «Visit the beacon» button (100 copper once), and the tutorial has its own beacon step (on Beelink). A single pass cannot reach «cabin done, beacon skipped» today, because the visit never reads or writes the tutorial state.

## Scope

In scope:

1. The short route in the walk (EU-2 change, required by this pass): STEPS become key (cabin), beacon (beelink), node (cabin); Doggee steps leave the walk.
2. The per-step skip for a NO_DATA place: the beacon step is recorded as skipped when its place is not LIVE or STALE. The record is immutable and counts as progress only when played (`tutorial_walk.record`, D19).
3. A link so the tutorial state and the visit state are visible to each other at the end of the pass: the visit reports its end, and the tutorial log is kept in memory for the page.
4. The browser pass itself, with one fixed port per test (the isolation rule from the decree).

Out of scope: the replay controls (EU-3); the gacha (EU-4, the gacha is already in the visit); NPC buildings (EU-5); any change to `estado.json`; any write to a node.

## Inventory measured today (main `7828f98`)

Flow of a visit, in the order the page runs it (`public/game/visitor_play.js`, `public/openworld/index.html` lines 106 to 123):

| step | what runs | where it ends today |
|---|---|---|
| arrival | `index.html` loads `tutorial_walk.js`, then the visit modules, then `visitor_play.js` | visit panel `#visitor-play` shows «Start an ephemeral visit» |
| start | `AtlasVisitorAccount.create(true)` (consent), then `AtlasVisitorEggs.create(account)` | state: Copper, Light, Step, Troops, Pity NO_DATA |
| beacon | «Visit the beacon · claim 100 copper once» (`game.beacon()`) | copper +100, once per visit (`claimed`) |
| step | «Advance one game step» (`game.advance()`) | step +1; eggs become ready when their count is reached |
| invoke | «Sign invocation · tc» for each gacha tier (cost in copper and light) | chronicle line with seal and rarity |
| adopt | «Sign adoption · egg n» when the egg is ready (`game.hatch`) | troop added |
| battle | `visitor_battle_ui.js` adds «visitor-fight-…» and `visitor-battle-result` | result line |
| conquest | `visitor_conquest.js` adds «visitor-conquer» and the list `#visitor-conquests` | records kept on this device |
| end | «End this visit» (`game.end()`, dispatches `visitor:end`) | panel reset to «Start an ephemeral visit» |

The tutorial walk, measured in `public/game/colony_controls.js` (`tutorialStep`): the step is played when the walker enters its node, and the log lives in the closure of `attach`. No visit module reads or writes it.

Where the pass cuts today:

- **Cut 1, the tutorial and the visit share nothing.** The visit beacon and the tutorial beacon are two buttons with two meanings. The pass needs one rule: the tutorial beacon step is recorded as skipped (NO_DATA) when Beelink is not alive. The visit beacon stays a visit action.
- **Cut 2, the short route is not in the walk.** `tutorial_walk.js` still lists the Doggee steps (egg, hatch, fight). The pass must reach the end of the route without them.
- **Cut 3, the end of the visit does not report.** `visitor:end` is dispatched, but nothing records the tutorial state at that point, so there is no coherent state to check after the pass.
- **Cut 4, the skip control skips the whole tutorial.** The skip control from #439 skips all steps at once. The decree needs a per-step record for a NO_DATA place, not a whole-tutorial skip.

## Correction to the EU-0 plan

The EU-0 plan (`usuario-efimero.md`, merged) said the gacha was «not seen in the visit flow» (G-d). That was wrong: the visit has «Sign invocation» buttons for each gacha tier, and the chronicle shows the results. G-d is closed. The replay gap (G-c) stays open for EU-3.

## Checklist (one piece = one PR; FIRMO per head)

- [x] EU-1.1 · inventory in odd (this document): flow measured, cuts named.
- [x] EU-1.2 · the short route in `tutorial_walk.js` (EU-2): STEPS and their pure cases, with sabotage (a step played on a NO_DATA place is refused).
- [x] EU-1.3 · the per-step skip for a NO_DATA place, recorded as skipped, never as done; pure cases with sabotage (a skipped step counted as progress is refused).
- [x] EU-1.4 · the link: the tutorial log is readable at the end of the visit, and the visit end is recorded next to it (page-level, in memory).
- [x] EU-1.5 · the browser pass: arrival, visit start, cabin key played, beacon skipped, visit beacon claimed, one invocation, visit end; then the tutorial and the account are checked for coherence. One fixed port per test, cleaned by PID. Verify with three consecutive runs.
- [x] EU-1.6 · gates per piece (lexicon, version, colony gate, openworld browser, seal chain in the same commit, door ≤ 16 KiB).

## Verification evidence

- Measured: the visit flow in `visitor_play.js` (button ids and their actions); the modules loaded in `index.html`; the absence of any tutorial reference in the visit modules (`grep` on `tut` and `skip` in `public/game/visitor_*.js` returns nothing).
- EU-1.2 and EU-1.3: `atlas/puros/tutorial_walk_casos.mjs` 17 cases, plus `colony_controls_casos.mjs`, 29 pass in total with the wrapper test. Sabotage: a dead place is never played; a skip is never progress; close never closes a walkable step.
- EU-1.4 and EU-1.5: `atlas/usuario_efimero_pasada_browser.mjs`, three consecutive runs green (key played, visit beacon and one step, visit end reports «played: key · skipped: beacon», account gone, node played on the second entry, walk complete). Sabotage (visit-end link removed): the pass goes red on the end report.
- EU-1.6: seal chain run in the required order (VERSION `preceptoros-2026-17-av`, `test_web` 75 tests OK, `arnes_sw` 24/24); `version_sw_gate` green; `lexicon` green; `colonia_pagina_gate` 11 passes; `openworld_browser` fallos []; `test_atlas` 44 OK; `sellar.py` consistent; door 7,385 B.
- Found while doing EU-1.2: `atlas/puros/colony_controls.js` had drifted from the served copy on main (the skip button of #439 was served but not in the source). Source synced to the served copy; the two are identical now.

## Standing signature

Required: FIRMA of this head before EU-1.2. FIRMA per PR after that.

## Methodology relief

None.

## Log

- 2026-10-31 · Inventory of the visit flow measured on `main` `7828f98`. Four cuts named. The gacha gap of the EU-0 plan corrected.

## Next step

FIRMA of this head, then EU-1 piece 1 is complete. Open item: the replay controls (EU-3).
