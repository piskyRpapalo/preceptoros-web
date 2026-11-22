# WEB · OpenWorld offline + Haiku UX recovery · seal kb

**State: PROPOSED · HITL.** One release on top of `claude/haiku-openworld-ux-20261121` (73d8fe24).

Measured on production `ka` (2026-11-21, HTTPS, Chromium, read-only): with the network off, `/openworld/` reloads but
30 scripts it loads (24 by tag, 6 at run time) were never precached (`walk_route.js`, `global_map.js`, `map_chat.js`, …), so the game cannot
start offline (`TypeError … FRAMES` from `hitl_walkers.js` reading the missing `AtlasWalkRoute`). The same list was
already missing on `jt`.

Change: the 30 paths join `JUEGO` in `public/sw-listas.js`; a pure case in `atlas/puros/openworld_online_cases.mjs`
fails if any script or stylesheet of `/openworld/` is missing from the precache. `sw_harness.mjs` allows exactly
`/game/map_chat.js` past the retired-hub `chat` rule. `DEPLOY.md` 186 → 210 routes. VERSION
`preceptoros-2026-25-kb` (next free seal in `bin/seal_registry.py next`, taken under the Sovereign's standing
authorization of 2026-11-21; the Mesa records it).

Seen on the S110 at 360 px, not fixed here: the tutorial sheet, the Visitors panel, the Beacon card and the chat stack
over the map; a tap meant for a hidden hex can untick the sharing consent (`shared_crabs.js:206`).

Review of #945 (Haiku, merged 23:40Z before review): main went red (`version_sw_gate`: 5 cached paths, VERSION ka;
`building_sheet_browser`: `building_sheet.js` 8099 B > 8000 B ceiling). This release seals kb and moves the sheet's
one-panel hook into `panel_x.js` (a `hidden` observer), so `building_sheet.js` is back to 7993 B; behaviour unchanged.
