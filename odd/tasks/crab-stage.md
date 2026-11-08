# crab-stage

Date: 2026-11-08
Law: Sovereign, chat 2026-11-08: «the crab is the centre of the web. Then you can anchor the duels and summons inside the map, with "zoom" animations into the map».

## Built

- `public/game/crab_stage.js`, loaded by `gamepad.js`.
  - **Egg reveal:** when an egg hatches, the reveal (`summon_reveal.js` «.revela», full screen until now) moves into `#stage`, over the map.
  - **Duel:** a practice duel (`visitor_battle_ui.js`) opens as a non-modal dialog on the map with `CS.hold(dialog)`. Without the stage it falls back to the old modal dialog.
  - **Camera:** in both cases it zooms from the current zoom to 2.2 in 520 ms (ease-out cubic), keeping the crab centred. The scene pops out of the crab (transform-origin = the crab's place).
  - **Closing:** the camera eases back to the zoom and pan it had before.
  - Pure functions `ease` and `centre`. Only the picture moves (law P5).
  - Reduced motion: still cuts. Forced colours: plain borders.
- `public/game/talk.css`:
  - Acho frame for the scenes on the map.
  - The duel's buttons become Acho pills (44 px, the chosen speed shown inverted).
  - The duel canvas is held to clamp(120px, 24vh, 190px) so «Return to the map» stays in view.

## Gates

- `atlas/puros/crab_stage_cases.mjs`: the easing lands exactly; centring puts the crab in the middle.
- The battle, conquest and replay guards find the dialog on the map (`#stage > dialog[open]`) or in the House.
- Doogee:
  - The egg hatched inside the map frame at zoom 2.2, and «Continue» brought the camera back to zoom 1.
  - A duel against the Reef patrol opened on the map (non-modal, zoom 2.2, the zoomed buildings above it).
  - A real tap on «Return to the map» closed it and restored zoom 1.

## NO_DATA

- The duel does not yet happen on the hex of the place it names: it happens where the crab stands. Walking the crab to the place's hex before the fight needs a route to the place.
- The duel scene paints its own paper background: the zoomed map is visible around it, not through it.
- Summons signed in a live node (`invocation:signed`) keep their own burst; they are not staged on the crab yet.
