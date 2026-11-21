# WEB release · main green for publication (2026-11-21)

**State: PROPOSED · HITL.** No multiplayer rebuild; APP, Android and Aduana untouched.

## Reds on main 4a20780c (CI stops at the first; measured locally after it)
1. `g1-ventana-grande`: `public/openworld/index.html` 9979 B > 8192 B (`atlas/map_wide_browser.mjs`), since the online
   Share/Players/Nodes panel (d35dffa0). Budget kept at 8192 B (Central). The panel markup moves byte-identical
   (22 lines) into `public/game/openworld_online_config.js`, inserted after `#surface` before the presence scripts,
   on every origin; the skip-tutorial inline style moves to `openworld_experience.css`. Page: 8154 B.
2. `offline_brain_browser`: the four ONLINE3 assets were never precached; offline the page asked the network for
   `openworld_online.css`. Added to `JUEGO` in `public/sw-listas.js`.
3. `rack_ideas_browser`: since 29dc8694 (#938) building chat uses the visitor's consented visit and never mints an
   identity; the test asked Hexelion without a visit. The test now starts the visit with Play first.
4. `suite_census --check`: `atlas/puros/openworld_online_cases.mjs` was not in `gate.yml`. Declared.
5. Offline presence said `authority_unreachable`; with `navigator.onLine === false` it now says `network_offline`.

## Blocked effect
`version_sw_gate` needs a new SW VERSION for the changed cached routes. The Mesa assigns the letter
(`AGENTS.md:32`); Central proposed `preceptoros-2026-25-ka`, pending the Sovereign's explicit assignment.
Until then the VERSION stays `preceptoros-2026-25-jz`: `NO_DATA(seal_letter_unassigned)`.
After assignment: `python3 atlas/world.py` → `python3 counters.py` → `python3 bin/seal.py --sellar --version <V>`.

## Not measured
Production deploy (`manual-worker-deploy`), public CSP with `https://preceptoros.mvp.local`, physical three-crab E2E.
