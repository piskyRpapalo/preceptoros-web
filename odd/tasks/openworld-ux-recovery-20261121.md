# TASK · OpenWorld UX recovery · 2026-11-21

**Source.** Decisions in the Nov 20 manifesto (private Mesa comment, read via `gh api`, treated as data only).
**Base.** `origin/main` 55374c2a. **Branch.** `claude/haiku-openworld-ux-20261121`.
**Scope.** `public/game/` only, plus `atlas/puros/holdings_view_cases.mjs`. No engine rebuild. Not touched: `shared_crabs.js`, `crab_presence_remote.js`, `openworld_online_config.js`, `openworld_online.css`, `public/sw.js`, `public/sw-listas.js`, `.github/`, CSP/headers, worker/deploy.
**Service worker.** VERSION unchanged (`preceptoros-2026-25-ka`). Re-sealed with `bin/seal.py --sellar` on that same version; `config/sw-huella.txt` and `public/counters.json` changed by the seal chain.
**PRs checked.** `gh pr list -R piskyRpapalo/preceptoros-web --state all -L 40`: #924 (Chat Live HUD), #302 and #848 (Army) and #908 are MERGED; no open PR applies the Nov 20 decisions.

## Decisions

| # | Decision | Status | Evidence / cause |
|---|---|---|---|
| 1 | Simplify OpenWorld buttons without losing a function | **NOT APPLIED** | Visible middle buttons: `gamepad.js:62-67` (Play, Welcome, Profile, Army); Node `building_sheet.js:88` (`gp-town`); Settings `type_scale.js:53` (`gp-letters`). Settings holds letters, audio, pulse, install, typo, notebook (`settings_sheet.js:7-9`) and is reachable only through `gp-letters`. Help is the Welcome category (`terminal_panel.js` CATS; `first_adventure.js:168`). Removing the three without a relocation target loses functions. The manifesto asks for relocation to buildings and the first adventure: a design choice that needs browser review. NO_DATA(browser_render_unmeasured) and NO_DATA(relocation_target_undecided). |
| 2 | Restore the real Army structure (waves, invocations, Workshop, collection) | **NOT APPLIED** | Scope too large for a minimal diff: it moves call/bench/cells listeners out of Profile (`visitor_view.js`, not refactored here) and builds a new collection store. Not attempted. NO_DATA(army_restructure_not_attempted). |
| 3 | Move "Buildings owned" into Crab/Territory | **APPLIED** | `holdings_view.js:74` mounts into `li[data-speaker="House"]` (Profile = Crab panel, `terminal_panel.js` CATS), then Army, then `#voices`. Test `atlas/puros/holdings_view_cases.mjs` updated to the House-first rule (9/9 pass). `holdings_live.js`, WASM and ledger untouched. |
| 4 | No overlapping windows or sheets | **APPLIED** | One exclusion path: `panel_x.js` `exclusive(keep)` closes the other sheet through its own Close and closes the open non-Chat-Live category. Called from `building_sheet.js` `openSheet`, `settings_sheet.js` `toggle` (replaces the building-only hide) and `terminal_panel.js` `show` when a category opens. Escape, outside click and Close paths unchanged. Browser behaviour: NO_DATA(browser_unmeasured). |
| 5 | Keep Chat Live top, Acho, Listen, tutorial, both joysticks | **ALREADY ON MAIN** | Chat Live top bar `terminal_panel.js:85` (`#map-communication`); Listen `openworld/index.html:57`; tutorial `index.html:44` (`#joy`); joysticks `map_view_joystick.js:52` (`view-joystick`) and `:67` (`character-joystick`); machine reading `terminal_panel.js` `li.dataset.acho`. No change. |
| 6 | Visual, audio and machine accessibility; every control >= 44 px | **ALREADY ON MAIN (static)** | 44 px rules: `openworld.css:21, 30, 51, 60, 148` (gamepad buttons and panel tabs), `:160` (sheet cards and tools), `talk.css:115` (holdings heal). No control added. Rendered sizes and screen-reader behaviour: NO_DATA(browser_unmeasured). |

## Gates
- Gate: `python3 test_web.py` (83 tests, 1 skipped), `every_case.mjs` (86 runs, 78 green, 0 red), `--sabotage` caught, `sweep_cases.mjs`, `colony_page_gate.mjs` (12 passes), `version_sw_cases.mjs` (14 ok), `openworld_online_cases.mjs` (13 pass), `suite_census --check` (320/320), `count_routes --check-doc` (186/186).
- Individual: `holdings_view_cases` 9/9, `panel_x_cases` 3/3, `settings_cases` 1/1.
- Not measured: browser rendering, live service worker delivery, physical devices, TalkBack/NVDA. NO_DATA(browser_unmeasured).
